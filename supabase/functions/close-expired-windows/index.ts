import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting close-expired-windows cron job...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find encounters that are > 7 days old and still have open windows
    const { data: expiredEncounters, error: fetchError } = await supabaseClient
      .from('encounters')
      .select('*, reviews:reviews(*)')
      .lte('accepted_at', sevenDaysAgo.toISOString())
      .eq('reviews_window_open', true)
      .eq('reviews_published', false);

    if (fetchError) {
      console.error('Error fetching expired encounters:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredEncounters?.length || 0} expired encounters`);

    let closedCount = 0;

    for (const encounter of expiredEncounters || []) {
      console.log(`Closing windows for encounter ${encounter.id} (7 day deadline passed)`);

      // Check if any reviews were submitted
      const { data: reviews } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('encounter_id', encounter.id)
        .eq('submitted', true);

      const hasReviews = reviews && reviews.length > 0;

      // If there are submitted reviews, publish them (single-sided review)
      if (hasReviews) {
        const { error: publishError } = await supabaseClient
          .from('reviews')
          .update({ 
            published: true, 
            published_at: now.toISOString() 
          })
          .eq('encounter_id', encounter.id)
          .eq('submitted', true);

        if (publishError) {
          console.error(`Error publishing single review for encounter ${encounter.id}:`, publishError);
        } else {
          console.log(`✅ Published single-sided review for encounter ${encounter.id}`);
        }
      }

      // Close the windows
      const { error: updateError } = await supabaseClient
        .from('encounters')
        .update({
          reviews_window_open: false,
          reviews_window_closed_at: now.toISOString(),
          reviews_window_closed_reason: 'deadline_passed',
          dateguard_window_open: false,
          dateguard_window_closed_at: now.toISOString(),
          status: 'closed',
          closed_at: now.toISOString(),
          ...(hasReviews && {
            reviews_published: true,
            reviews_published_at: now.toISOString()
          })
        })
        .eq('id', encounter.id);

      if (updateError) {
        console.error(`Error closing encounter ${encounter.id}:`, updateError);
        continue;
      }

      // Expire V.A.I. info in any active DateGuard sessions
      const { error: expireSessionsError } = await supabaseClient
        .from('dateguard_sessions')
        .update({
          memo: '[V.A.I. INFO EXPIRED - Review Window Closed]'
        })
        .eq('encounter_id', encounter.id)
        .eq('status', 'active');

      if (expireSessionsError) {
        console.error(`Error expiring sessions for encounter ${encounter.id}:`, expireSessionsError);
      }

      closedCount++;
      console.log(`✅ Closed windows for encounter ${encounter.id}`);
    }

    console.log(`✅ Closed ${closedCount} expired encounters`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        closedCount,
        message: `Closed ${closedCount} expired encounters`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in close-expired-windows:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
