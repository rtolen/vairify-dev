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
    console.log('Starting publish-reviews cron job...');

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

    // Find encounters where both reviews are submitted and 24h has passed
    const { data: readyEncounters, error: fetchError } = await supabaseClient
      .from('encounters')
      .select('*, reviews:reviews(*)')
      .eq('provider_review_submitted', true)
      .eq('client_review_submitted', true)
      .eq('reviews_published', false)
      .lte('reviews_publish_scheduled_for', now.toISOString());

    if (fetchError) {
      console.error('Error fetching ready encounters:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${readyEncounters?.length || 0} encounters ready to publish`);

    let publishedCount = 0;

    for (const encounter of readyEncounters || []) {
      console.log(`Publishing reviews for encounter ${encounter.id}`);

      // Update reviews to published
      const { error: updateReviewsError } = await supabaseClient
        .from('reviews')
        .update({ 
          published: true, 
          published_at: now.toISOString() 
        })
        .eq('encounter_id', encounter.id);

      if (updateReviewsError) {
        console.error(`Error updating reviews for encounter ${encounter.id}:`, updateReviewsError);
        continue;
      }

      // Close the encounter and windows
      const { error: updateEncounterError } = await supabaseClient
        .from('encounters')
        .update({
          reviews_published: true,
          reviews_published_at: now.toISOString(),
          reviews_window_open: false,
          reviews_window_closed_at: now.toISOString(),
          reviews_window_closed_reason: 'reviews_posted',
          dateguard_window_open: false,
          dateguard_window_closed_at: now.toISOString(),
          status: 'closed',
          closed_at: now.toISOString()
        })
        .eq('id', encounter.id);

      if (updateEncounterError) {
        console.error(`Error closing encounter ${encounter.id}:`, updateEncounterError);
        continue;
      }

      // Expire V.A.I. info in any active DateGuard sessions
      const { error: expireSessionsError } = await supabaseClient
        .from('dateguard_sessions')
        .update({
          memo: '[V.A.I. INFO EXPIRED - Reviews Posted]'
        })
        .eq('encounter_id', encounter.id)
        .eq('status', 'active');

      if (expireSessionsError) {
        console.error(`Error expiring sessions for encounter ${encounter.id}:`, expireSessionsError);
      }

      publishedCount++;
      console.log(`✅ Published reviews and closed encounter ${encounter.id}`);
    }

    console.log(`✅ Published ${publishedCount} encounters`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        publishedCount,
        message: `Published ${publishedCount} encounters`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in publish-reviews:', error);
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
