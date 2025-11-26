import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPSUpdateRequest {
  session_id: string;
  lat: number;
  lng: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, lat, lng }: GPSUpdateRequest = await req.json();

    if (!session_id || !lat || !lng) {
      return new Response(
        JSON.stringify({ success: false, error: 'session_id, lat, and lng are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update session GPS
    const { error: updateError } = await supabase
      .from('dateguard_sessions')
      .update({
        gps_coordinates: { lat, lng },
        last_gps_update: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) throw updateError;

    // Check if emergency is active - if so, send GPS update SMS
    const { data: session } = await supabase
      .from('dateguard_sessions')
      .select('emergency_command_center_activated, selected_groups')
      .eq('id', session_id)
      .single();

    if (session?.emergency_command_center_activated) {
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

      // Send GPS update SMS
      const gpsString = `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      const gpsMessage = `📍 GPS Update: ${gpsString}\n${googleMapsLink}`;

      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
      const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

      const isTestMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER;

      for (const guardian of allGuardians) {
        if (!guardian.phone) continue;

        if (isTestMode) {
          console.log(`🧪 TEST MODE: GPS update to ${guardian.phone}: ${gpsMessage}`);
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
                  Body: gpsMessage,
                }),
              }
            );
          } catch (error) {
            console.error(`Error sending GPS update to ${guardian.phone}:`, error);
          }
        }
      }

      // Store GPS update message
      await supabase
        .from('emergency_command_center_messages')
        .insert({
          session_id: session_id,
          message_type: 'gps_update',
          content: gpsMessage,
          sent_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        gps: { lat, lng },
        updated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-gps-tracking:', error);
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


