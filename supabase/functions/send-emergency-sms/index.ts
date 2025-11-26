/**
 * DATEGUARD EMERGENCY SMS NOTIFICATION SYSTEM
 * 
 * This edge function sends SMS alerts to guardians via Twilio when:
 * - Panic button is pressed
 * - Timer expires (session end without check-in)
 * - Decoy code is entered
 * - Manual emergency is triggered
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Get Twilio Account Credentials:
 *    - Sign up at https://www.twilio.com/try-twilio
 *    - Get your Account SID and Auth Token from the Twilio Console
 *    - Purchase a phone number from Twilio (or use trial number for testing)
 * 
 * 2. Configure Environment Variables in Supabase:
 *    - Go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
 *    - Add these secrets:
 *      * TWILIO_ACCOUNT_SID=your_account_sid_here
 *      * TWILIO_AUTH_TOKEN=your_auth_token_here
 *      * TWILIO_PHONE_NUMBER=+1234567890 (your Twilio phone number in E.164 format)
 * 
 * 3. Test Mode (Placeholder Keys):
 *    - If keys are not set or are placeholders, function will log messages instead of sending
 *    - Check Supabase Edge Function logs to see what would be sent
 *    - This allows testing without incurring SMS costs
 * 
 * 4. Deploy the Function:
 *    - Run: supabase functions deploy send-emergency-sms
 *    - Or deploy via Supabase Dashboard
 * 
 * 5. Integration:
 *    - This function is called by send-emergency-alert/index.ts
 *    - Can also be called directly from frontend if needed
 * 
 * USAGE:
 * 
 * POST /functions/v1/send-emergency-sms
 * {
 *   "user_id": "uuid",
 *   "session_id": "uuid (optional)",
 *   "guardian_phone": "+1234567890",
 *   "guardian_name": "John Doe",
 *   "user_name": "Jane Smith",
 *   "location_address": "123 Main St, Atlanta, GA",
 *   "location_gps": "33.7490°N, 84.3880°W",
 *   "trigger_type": "panic_button" | "timer_expired" | "decoy_code" | "missed_checkin" | "manual",
 *   "emergency_event_id": "uuid (optional)"
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmergencySMSRequest {
  user_id: string;
  session_id?: string;
  guardian_phone: string;
  guardian_name: string;
  user_name: string;
  location_address?: string;
  location_gps?: string;
  trigger_type: 'panic_button' | 'timer_expired' | 'decoy_code' | 'missed_checkin' | 'manual';
  emergency_event_id?: string;
}

// Check if we're in test mode (placeholder keys)
function isTestMode(): boolean {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  // Test mode if any key is missing or contains placeholder values
  const isPlaceholder = (value: string | undefined): boolean => {
    if (!value) return true;
    const lower = value.toLowerCase();
    return lower.includes('placeholder') || 
           lower.includes('your_') || 
           lower.includes('xxx') ||
           lower === 'test' ||
           lower === 'demo';
  };

  return !accountSid || !authToken || !phoneNumber || 
         isPlaceholder(accountSid) || 
         isPlaceholder(authToken) || 
         isPlaceholder(phoneNumber);
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, assume US number and add +1
  if (!phone.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    return '+' + cleaned;
  }
  
  return phone;
}

// Generate SMS message based on trigger type
function generateMessage(data: EmergencySMSRequest): string {
  const { user_name, guardian_name, location_address, location_gps, trigger_type } = data;
  
  const triggerMessages: Record<string, string> = {
    panic_button: '🚨 PANIC BUTTON PRESSED',
    timer_expired: '⏰ SESSION TIMER EXPIRED',
    decoy_code: '⚠️ DECOY CODE ENTERED',
    missed_checkin: '⏱️ MISSED CHECK-IN',
    manual: '🚨 MANUAL EMERGENCY ALERT'
  };

  const location = location_address || location_gps || 'Location unknown';
  const time = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${triggerMessages[trigger_type] || '🚨 EMERGENCY ALERT'}

${user_name} needs immediate assistance.

📍 Location: ${location}
🕐 Time: ${time}
👤 Guardian: ${guardian_name}

⚠️ This is a real emergency. Please check on them immediately.

If you cannot reach them, contact authorities.
Call 911 if this is life-threatening.

- Vairify DateGuard Emergency System`;

}

// Send SMS via Twilio API
async function sendTwilioSMS(
  to: string,
  message: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const formattedTo = formatPhoneNumber(to);
  
  try {
    // Create Basic Auth header for Twilio
    const credentials = btoa(`${accountSid}:${authToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedTo,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return {
        success: false,
        error: data.message || `Twilio error: ${response.status}`,
      };
    }

    return {
      success: true,
      messageSid: data.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: EmergencySMSRequest = await req.json();

    // Validate required fields
    if (!requestData.user_id || !requestData.guardian_phone || !requestData.guardian_name || !requestData.user_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: user_id, guardian_phone, guardian_name, user_name',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isTest = isTestMode();

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const phoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Generate SMS message
    const message = generateMessage(requestData);

    if (isTest) {
      // TEST MODE: Log instead of sending
      console.log('='.repeat(60));
      console.log('🧪 TEST MODE: SMS NOTIFICATION (NOT SENT)');
      console.log('='.repeat(60));
      console.log(`To: ${requestData.guardian_phone}`);
      console.log(`From: ${phoneNumber || 'PLACEHOLDER'}`);
      console.log(`Guardian: ${requestData.guardian_name}`);
      console.log(`User: ${requestData.user_name}`);
      console.log(`Trigger: ${requestData.trigger_type}`);
      console.log(`Location: ${requestData.location_address || requestData.location_gps || 'Unknown'}`);
      console.log('---');
      console.log('Message:');
      console.log(message);
      console.log('='.repeat(60));

      // Create Supabase client to log test notification
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Log test notification in database for debugging
      if (requestData.session_id) {
        await supabase.from('dateguard_messages').insert({
          session_id: requestData.session_id,
          sender_type: 'system',
          sender_name: 'SMS TEST MODE',
          message_type: 'test',
          message: `🧪 TEST: SMS would be sent to ${requestData.guardian_name} at ${requestData.guardian_phone}`,
          metadata: {
            test_mode: true,
            guardian_phone: requestData.guardian_phone,
            guardian_name: requestData.guardian_name,
            message_preview: message.substring(0, 100),
            trigger_type: requestData.trigger_type,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          message: 'SMS logged (test mode - not sent)',
          logged_to: requestData.guardian_phone,
          message_preview: message.substring(0, 100),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PRODUCTION MODE: Send actual SMS
    if (!accountSid || !authToken || !phoneNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`📱 Sending emergency SMS to ${requestData.guardian_name} at ${requestData.guardian_phone}`);

    const result = await sendTwilioSMS(
      requestData.guardian_phone,
      message,
      accountSid,
      authToken,
      phoneNumber
    );

    if (!result.success) {
      console.error(`❌ Failed to send SMS to ${requestData.guardian_phone}:`, result.error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to send SMS',
          guardian_phone: requestData.guardian_phone,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ SMS sent successfully to ${requestData.guardian_phone} (Message SID: ${result.messageSid})`);

    // Log successful SMS in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (requestData.session_id) {
      await supabase.from('dateguard_messages').insert({
        session_id: requestData.session_id,
        sender_type: 'system',
        sender_name: 'SMS SYSTEM',
        message_type: 'sms_sent',
        message: `📱 Emergency SMS sent to ${requestData.guardian_name} at ${requestData.guardian_phone}`,
        metadata: {
          guardian_phone: requestData.guardian_phone,
          guardian_name: requestData.guardian_name,
          twilio_message_sid: result.messageSid,
          trigger_type: requestData.trigger_type,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS sent successfully',
        message_sid: result.messageSid,
        guardian_phone: requestData.guardian_phone,
        guardian_name: requestData.guardian_name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-emergency-sms:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
