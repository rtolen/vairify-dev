import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReferralSMSRequest {
  invitation_id: string;
  to_phone: string;
  referral_code?: string;
  custom_code?: string;
  message?: string;
}

// Format phone to E.164 format
function formatE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      invitation_id,
      to_phone,
      referral_code,
      custom_code,
      message
    }: SendReferralSMSRequest = await req.json();

    if (!invitation_id || !to_phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: invitation_id, to_phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('referral_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('referrer_id', user.id)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Twilio credentials
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
    const isTestMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER;

    // Build referral link
    const codeToUse = custom_code || referral_code;
    if (!codeToUse) {
      return new Response(
        JSON.stringify({ success: false, error: 'No referral code found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referralLink = `vairify.com/join/${codeToUse}`;
    
    // Build SMS message
    const defaultMessage = `Hey! I'm on Vairify - the verified safety platform. Join with my code & get 20% off: ${referralLink}\n\nReply STOP to unsubscribe`;
    const smsBody = message || defaultMessage;

    // Validate message length (SMS limit is 160 characters for single message)
    if (smsBody.length > 160) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMS message exceeds 160 character limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone to E.164
    const formattedPhone = formatE164(to_phone);

    // Calculate cost (approximate: $0.05 per SMS in US/Canada)
    const estimatedCost = 0.05;

    if (isTestMode) {
      console.log(`🧪 TEST MODE: SMS NOT sent`);
      console.log(`To: ${formattedPhone}`);
      console.log(`Body: ${smsBody}`);
      console.log(`Estimated Cost: $${estimatedCost.toFixed(2)}`);

      // Update invitation with test mode status
      await supabase
        .from('referral_invitations')
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          delivery_error: 'TEST MODE - SMS not actually sent'
        })
        .eq('id', invitation_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS logged in test mode (not sent)',
          sent: false,
          test_mode: true,
          estimated_cost: estimatedCost,
          referral_link: referralLink
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const params = new URLSearchParams({
      To: formattedPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: smsBody,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio SMS error:', twilioData);

      // Update invitation with failure status
      await supabase
        .from('referral_invitations')
        .update({
          delivery_status: 'failed',
          sent_at: new Date().toISOString(),
          delivery_error: twilioData.message || 'Failed to send SMS via Twilio'
        })
        .eq('id', invitation_id);

      throw new Error(twilioData.message || 'Failed to send SMS via Twilio');
    }

    // Update invitation with success status
    await supabase
      .from('referral_invitations')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        delivery_error: null
      })
      .eq('id', invitation_id);

    console.log('✅ SMS sent successfully via Twilio:', twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        sent: true,
        twilio_sid: twilioData.sid,
        estimated_cost: estimatedCost,
        referral_link: referralLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-referral-sms:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


