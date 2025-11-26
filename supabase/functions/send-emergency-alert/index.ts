import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmergencyAlertRequest {
  user_id: string;
  session_id?: string;
  location_gps?: string;
  location_address?: string;
  trigger_type: 'panic_button' | 'decoy_code' | 'missed_checkin' | 'manual';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, session_id, location_gps, location_address, trigger_type }: EmergencyAlertRequest = await req.json();

    console.log(`🚨 Emergency alert triggered for user ${user_id}, type: ${trigger_type}`);

    // 1. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    // 2. Get all active guardians for this user
    const { data: guardians } = await supabase
      .from('guardians')
      .select('id, name, phone, user_id')
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (!guardians || guardians.length === 0) {
      console.log('⚠️ No active guardians found for user');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Emergency logged but no guardians to notify',
          guardians_notified: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create emergency event record
    const emergencyData = {
      user_id,
      session_id,
      trigger_type,
      location_gps,
      location_address,
      triggered_at: new Date().toISOString(),
      guardians_notified: guardians.map(g => g.id),
      status: 'active'
    };

    const { data: emergencyEvent, error: eventError } = await supabase
      .from('emergency_events')
      .insert(emergencyData)
      .select()
      .single();

    if (eventError) {
      console.error('Error creating emergency event:', eventError);
    }

    // 4. Send notifications to all guardians
    const notificationPromises = guardians.map(async (guardian) => {
      // Create guardian notification message
      await supabase.from('dateguard_messages').insert({
        session_id: session_id || emergencyEvent?.id,
        sender_type: 'system',
        sender_name: 'EMERGENCY SYSTEM',
        message_type: 'emergency',
        message: `🚨 EMERGENCY ALERT\n\n${profile?.full_name || 'User'} has triggered an emergency alert.\n\n📍 Location: ${location_address || 'Unknown'}\n🕐 Time: ${new Date().toLocaleString()}\n\n⚠️ This is a real emergency. Check on them immediately.`,
        metadata: {
          guardian_id: guardian.id,
          guardian_name: guardian.name,
          guardian_phone: guardian.phone,
          emergency_event_id: emergencyEvent?.id,
          location_gps,
          trigger_type
        }
      });

      console.log(`✅ Notification queued for guardian: ${guardian.name}`);
      
      // Note: SMS sending is now handled by send-emergency-command-center-sms
      // This function is kept for backward compatibility but should call ECC function
      if (session_id && guardian.phone) {
        // If we have a session_id, use the new ECC system
        // The ECC function will be called separately
        console.log(`📱 Guardian ${guardian.name} will be notified via Emergency Command Center`);
      }
    });

    await Promise.all(notificationPromises);

    // 5. Update session status if this is part of an active DateGuard session
    if (session_id) {
      await supabase
        .from('dateguard_sessions')
        .update({ 
          status: 'emergency',
          updated_at: new Date().toISOString()
        })
        .eq('id', session_id);

      // Create emergency tasks for guardians
      const tasks = [
        { session_id, task_type: 'call_user', claimed_by: null },
        { session_id, task_type: 'check_location', claimed_by: null },
        { session_id, task_type: 'contact_authorities', claimed_by: null }
      ];

      await supabase.from('emergency_tasks').insert(tasks);
    }

    console.log(`✅ Emergency alert sent to ${guardians.length} guardians`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Emergency alert sent successfully',
        guardians_notified: guardians.length,
        emergency_event_id: emergencyEvent?.id,
        location: location_address
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Emergency alert error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
