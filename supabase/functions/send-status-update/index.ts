import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusUpdateRequest {
  session_id: string;
  status_type: 'checkin' | 'extended' | 'ended' | 'user_activity';
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, status_type, message }: StatusUpdateRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session and guardian groups
    const { data: session } = await supabase
      .from('dateguard_sessions')
      .select('selected_groups, emergency_command_center_activated')
      .eq('id', session_id)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    // Only send SMS if emergency is active
    if (!session.emergency_command_center_activated) {
      return new Response(
        JSON.stringify({ success: true, message: 'Status update logged (no SMS - emergency not active)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get guardian groups
    const selectedGroupIds = session.selected_groups || [];
    const { data: groups } = await supabase
      .from('guardian_groups')
      .select('members')
      .in('id', selectedGroupIds);

    const allGuardians: Array<{ phone: string; name: string }> = [];
    groups?.forEach(group => {
      if (group.members && Array.isArray(group.members)) {
        allGuardians.push(...group.members);
      }
    });

    // Send SMS to guardians
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    const isTestMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER;

    for (const guardian of allGuardians) {
      if (!guardian.phone) continue;

      if (isTestMode) {
        console.log(`🧪 TEST MODE: Status update to ${guardian.phone}: ${message}`);
      } else {
        try {
          let phone = guardian.phone.replace(/\D/g, '');
          if (!phone.startsWith('+')) {
            if (phone.length === 10) phone = '1' + phone;
            phone = '+' + phone;
          }

          const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: TWILIO_PHONE_NUMBER,
                To: phone,
                Body: `📱 DateGuard Update: ${message}`,
              }),
            }
          );
        } catch (error) {
          console.error(`Error sending status update to ${guardian.phone}:`, error);
        }
      }
    }

    // Store status update message
    await supabase
      .from('emergency_command_center_messages')
      .insert({
        session_id: session_id,
        message_type: 'status_change',
        content: message,
        sent_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        success: true,
        test_mode: isTestMode,
        guardians_notified: allGuardians.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-status-update:', error);
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


