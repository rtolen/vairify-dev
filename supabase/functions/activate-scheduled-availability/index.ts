import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilitySchedule {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  is_enabled: boolean;
}

interface ProviderProfile {
  user_id: string;
  auto_availability_enabled: boolean;
  available_now: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled availability activation check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    console.log(`Current day of week: ${currentDayOfWeek}, Time: ${now.toISOString()}`);

    // Get all providers with auto-availability enabled
    const { data: providers, error: providersError } = await supabase
      .from('provider_profiles')
      .select('user_id, auto_availability_enabled, available_now')
      .eq('auto_availability_enabled', true);

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      throw providersError;
    }

    if (!providers || providers.length === 0) {
      console.log('No providers with auto-availability enabled');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No providers with auto-availability enabled',
          providersChecked: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${providers.length} providers with auto-availability enabled`);

    // Get schedules for today for all these providers
    const providerIds = providers.map(p => p.user_id);
    const { data: schedules, error: schedulesError } = await supabase
      .from('provider_availability_schedules')
      .select('*')
      .in('user_id', providerIds)
      .eq('day_of_week', currentDayOfWeek)
      .eq('is_enabled', true);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      console.log('No active schedules for today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active schedules for today',
          providersChecked: providers.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${schedules.length} schedules for today`);

    let activatedCount = 0;
    let deactivatedCount = 0;

    // Process each schedule
    for (const schedule of schedules as AvailabilitySchedule[]) {
      try {
        // Convert times to user's timezone
        const userTimezone = schedule.timezone || 'America/New_York';
        
        // Get current time in user's timezone
        const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const currentTime = userNow.getHours() * 60 + userNow.getMinutes();
        
        // Parse schedule times (format: HH:MM:SS)
        const [startHour, startMin] = schedule.start_time.split(':').map(Number);
        const [endHour, endMin] = schedule.end_time.split(':').map(Number);
        
        const scheduleStart = startHour * 60 + startMin;
        const scheduleEnd = endHour * 60 + endMin;
        
        const provider = providers.find(p => p.user_id === schedule.user_id);
        const isWithinSchedule = currentTime >= scheduleStart && currentTime < scheduleEnd;
        
        console.log(`Provider ${schedule.user_id}: Current ${currentTime}, Schedule ${scheduleStart}-${scheduleEnd}, Within: ${isWithinSchedule}, Currently available: ${provider?.available_now}`);

        // Activate if within schedule and not already available
        if (isWithinSchedule && !provider?.available_now) {
          console.log(`Activating provider ${schedule.user_id}`);
          
          const { error: updateError } = await supabase
            .from('provider_profiles')
            .update({
              available_now: true,
              available_now_started_at: now.toISOString(),
              available_now_location: null, // Will be set when they confirm location
            })
            .eq('user_id', schedule.user_id);

          if (updateError) {
            console.error(`Error activating provider ${schedule.user_id}:`, updateError);
          } else {
            activatedCount++;
            
            // Send notification
            await supabase.from('notifications').insert({
              user_id: schedule.user_id,
              type: 'availability_auto_activated',
              title: 'Auto-Activated',
              message: 'Your Available Now status was automatically activated based on your schedule.',
              metadata: {
                schedule_id: schedule.id,
                activated_at: now.toISOString(),
                day_of_week: currentDayOfWeek,
              },
            });
          }
        }
        // Deactivate if outside schedule and currently available (only if auto-activated)
        else if (!isWithinSchedule && provider?.available_now) {
          console.log(`Schedule ended for provider ${schedule.user_id}, but keeping available (manual control)`);
          // We don't auto-deactivate to give providers control
        }
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
      }
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      providersChecked: providers.length,
      schedulesChecked: schedules.length,
      providersActivated: activatedCount,
      providersDeactivated: deactivatedCount,
    };

    console.log('Scheduled availability check complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in scheduled availability activation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
