/**
 * DATEGUARD SESSION EXPIRY CHECKER
 * 
 * This cron job checks for expired DateGuard sessions and triggers emergency alerts.
 * 
 * SETUP:
 * 1. Schedule this function to run every 5 minutes via Supabase Cron Jobs
 * 2. Go to Database > Cron Jobs and add:
 *    - Schedule: */5 * * * * (every 5 minutes)
 *    - SQL: SELECT cron.schedule('check-expired-sessions', '*/5 * * * *', $$SELECT net.http_post(url:='https://[your-project-ref].supabase.co/functions/v1/check-expired-sessions', headers:='{"Content-Type": "application/json", "Authorization": "Bearer [your-anon-key]"}')::json$$);
 * 
 * This function:
 * - Finds active sessions where ends_at has passed
 * - Checks if user checked in recently (within last 5 minutes of expiry)
 * - If no check-in, triggers emergency alert with trigger_type: 'timer_expired'
 * - Updates session status to 'emergency'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Checking for expired DateGuard sessions...');

    const now = new Date().toISOString();
    
    // Find sessions that have expired (ends_at < now) and are still active
    // Check if last_checkin_at was within 5 minutes of expiry (grace period)
    const { data: expiredSessions, error: fetchError } = await supabase
      .from('dateguard_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('ends_at', now);

    if (fetchError) {
      console.error('Error fetching expired sessions:', fetchError);
      throw fetchError;
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      console.log('✅ No expired sessions found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No expired sessions found',
          checked: 0,
          triggered: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${expiredSessions.length} expired session(s)`);

    let triggeredCount = 0;
    const gracePeriodMinutes = 5;

    for (const session of expiredSessions) {
      // Check if user checked in within grace period (5 minutes before expiry)
      const sessionEndTime = new Date(session.ends_at).getTime();
      const gracePeriodEnd = sessionEndTime + (gracePeriodMinutes * 60 * 1000);
      const nowTime = Date.now();

      // If we're past the grace period and no recent check-in, trigger emergency
      const lastCheckin = session.last_checkin_at 
        ? new Date(session.last_checkin_at).getTime() 
        : 0;

      const shouldTrigger = nowTime > gracePeriodEnd && 
        (lastCheckin === 0 || lastCheckin < sessionEndTime - (gracePeriodMinutes * 60 * 1000));

      if (shouldTrigger) {
        console.log(`⏰ Session ${session.id} expired without check-in - triggering emergency`);

        // Update session status
        await supabase
          .from('dateguard_sessions')
          .update({ status: 'emergency' })
          .eq('id', session.id);

        // Trigger emergency alert (this will send SMS to all guardians)
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          
          const alertResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-emergency-alert`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                user_id: session.user_id,
                session_id: session.id,
                location_address: session.location_address,
                location_gps: session.location_gps,
                trigger_type: 'timer_expired',
              }),
            }
          );

          const alertResult = await alertResponse.json();

          if (!alertResponse.ok || !alertResult.success) {
            console.error(`❌ Failed to trigger emergency for session ${session.id}:`, alertResult.error || alertResult);
          } else {
            console.log(`✅ Emergency alert triggered for session ${session.id}`);
            triggeredCount++;
          }
        } catch (error) {
          console.error(`❌ Error triggering emergency for session ${session.id}:`, error);
        }
      } else {
        // User checked in recently or within grace period - just mark as completed
        console.log(`✅ Session ${session.id} expired but user checked in recently - marking as completed`);
        await supabase
          .from('dateguard_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);
      }
    }

    console.log(`✅ Checked ${expiredSessions.length} expired sessions, triggered ${triggeredCount} emergency alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${expiredSessions.length} expired sessions, triggered ${triggeredCount} emergency alerts`,
        checked: expiredSessions.length,
        triggered: triggeredCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-expired-sessions:', error);
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

