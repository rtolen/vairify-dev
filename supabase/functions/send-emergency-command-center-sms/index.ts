import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ECCSMSRequest {
  session_id: string;
  trigger_type: 'panic_button' | 'timer_expired' | 'decoy_code';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, trigger_type }: ECCSMSRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('dateguard_sessions')
      .select(`
        *,
        user:profiles!dateguard_sessions_user_id_fkey(full_name, vai_number)
      `)
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Get guardian groups
    const selectedGroupIds = session.selected_groups || [];
    if (selectedGroupIds.length === 0) {
      throw new Error('No guardian groups selected');
    }

    // Get all guardians from selected groups
    const { data: groups, error: groupsError } = await supabase
      .from('guardian_groups')
      .select('members')
      .in('id', selectedGroupIds);

    if (groupsError) throw groupsError;

    const allGuardians: Array<{ phone: string; name: string }> = [];
    groups?.forEach(group => {
      if (group.members && Array.isArray(group.members)) {
        allGuardians.push(...group.members);
      }
    });

    if (allGuardians.length === 0) {
      throw new Error('No guardians found in selected groups');
    }

    // Format meeting time
    const meetingStart = new Date(session.started_at);
    const meetingEnd = new Date(session.scheduled_end_at || session.ends_at);
    const meetingTime = `${meetingStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}-${meetingEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    // Format trigger message
    let triggerMessage = '';
    if (trigger_type === 'timer_expired') {
      triggerMessage = `Timer expired: ${meetingEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (NO RESPONSE)`;
    } else if (trigger_type === 'panic_button') {
      triggerMessage = `PANIC BUTTON PRESSED at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (trigger_type === 'decoy_code') {
      triggerMessage = `DECOY CODE ACTIVATED at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    // Get GPS coordinates
    const gps = session.gps_coordinates || {};
    const gpsLat = gps.lat || 0;
    const gpsLng = gps.lng || 0;
    const gpsString = `${gpsLat.toFixed(4)}°N, ${Math.abs(gpsLng).toFixed(4)}°W`;
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${gpsLat},${gpsLng}`;

    // Get police station info
    const police = session.nearest_police || {};
    const policeInfo = police.name 
      ? `👮 NEAREST POLICE:\n${police.name}\n${police.address || ''}\n${police.phone || ''}\n${police.distance || 0} miles away`
      : '👮 NEAREST POLICE: Not available';

    // Get partner VAI (from encounter if available)
    let partnerVAI = 'Not available';
    if (session.encounter_id) {
      const { data: encounter } = await supabase
        .from('encounters')
        .select(`
          provider:profiles!encounters_provider_id_fkey(vai_number),
          client:profiles!encounters_client_id_fkey(vai_number)
        `)
        .eq('id', session.encounter_id)
        .single();

      if (encounter) {
        const userVAI = session.user?.vai_number;
        partnerVAI = encounter.provider?.vai_number === userVAI 
          ? encounter.client?.vai_number || 'Not available'
          : encounter.provider?.vai_number || 'Not available';
        
        // Anonymize VAI (show only last 3 chars)
        if (partnerVAI && partnerVAI !== 'Not available') {
          partnerVAI = `LEO-${partnerVAI.slice(-3)}`;
        }
      }
    }

    // Build Emergency Command Center message
    const message = `🚨 EMERGENCY COMMAND CENTER ACTIVATED

User: ${session.user?.full_name || 'User'}
Meeting: ${meetingTime}
${triggerMessage}

📍 CURRENT LOCATION:
${gpsString}
${googleMapsLink}

🏨 PRE-MEETING INTEL:
${session.pre_activation_notes ? `Note: "${session.pre_activation_notes}"` : 'No notes provided'}
${session.location_photo_url ? `Photo: ${session.location_photo_url}` : ''}

${policeInfo}

👤 PARTNER INFO:
VAI: ${partnerVAI}
Profile: ${session.encounter_id ? `View in app` : 'Not available'}

⚠️ ACTIONS:
Reply SAFE if you reach ${session.user?.full_name || 'user'}
Reply 911 to dispatch police`;

    // Send SMS to all guardians via Twilio
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    const isTestMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER;

    const sentResults: Array<{ phone: string; success: boolean; error?: string }> = [];

    for (const guardian of allGuardians) {
      if (!guardian.phone) continue;

      if (isTestMode) {
        console.log(`🧪 TEST MODE: Would send ECC SMS to ${guardian.name} at ${guardian.phone}`);
        console.log('Message:', message);
        sentResults.push({ phone: guardian.phone, success: true });
      } else {
        try {
          // Format phone number
          let phone = guardian.phone.replace(/\D/g, '');
          if (!phone.startsWith('+')) {
            if (phone.length === 10) phone = '1' + phone;
            phone = '+' + phone;
          }

          // Send via Twilio
          const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
          const twilioResponse = await fetch(
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
                Body: message,
              }),
            }
          );

          const twilioData = await twilioResponse.json();
          sentResults.push({
            phone: guardian.phone,
            success: twilioResponse.ok,
            error: twilioData.message,
          });
        } catch (error) {
          console.error(`Error sending SMS to ${guardian.phone}:`, error);
          sentResults.push({
            phone: guardian.phone,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Store ECC message in database
    await supabase
      .from('emergency_command_center_messages')
      .insert({
        session_id: session_id,
        message_type: 'initial',
        content: message,
        sent_at: new Date().toISOString(),
      });

    // Update session
    await supabase
      .from('dateguard_sessions')
      .update({
        emergency_command_center_activated: true,
        gps_tracking_enabled: true,
      })
      .eq('id', session_id);

    return new Response(
      JSON.stringify({
        success: true,
        test_mode: isTestMode,
        guardians_notified: sentResults.filter(r => r.success).length,
        total_guardians: allGuardians.length,
        results: sentResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-emergency-command-center-sms:', error);
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


