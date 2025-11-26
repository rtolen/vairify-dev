import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting Available Now expiration check...');

    // Find all providers with available_now = true and expired timestamps (> 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: expiredProviders, error: fetchError } = await supabase
      .from('provider_profiles')
      .select('id, user_id, username, available_now_started_at')
      .eq('available_now', true)
      .lt('available_now_started_at', oneHourAgo);

    if (fetchError) {
      console.error('Error fetching expired providers:', fetchError);
      throw fetchError;
    }

    if (!expiredProviders || expiredProviders.length === 0) {
      console.log('No expired providers found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired providers found',
          expired: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredProviders.length} expired providers`);

    // Update all expired providers
    const userIds = expiredProviders.map(p => p.user_id);
    
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({
        available_now: false,
        available_now_started_at: null,
        available_now_location: null
      })
      .in('user_id', userIds);

    if (updateError) {
      console.error('Error updating providers:', updateError);
      throw updateError;
    }

    console.log(`Successfully disabled Available Now for ${expiredProviders.length} providers`);

    // Send notifications to expired providers
    const notifications = expiredProviders.map(provider => ({
      user_id: provider.user_id,
      type: 'availability_expired',
      title: 'Available Now Expired',
      message: 'Your 1-hour Available Now window has ended. Toggle it back on to become visible again.',
      metadata: {
        expired_at: new Date().toISOString(),
        username: provider.username
      }
    }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't throw - notifications are not critical
      } else {
        console.log(`Created ${notifications.length} expiration notifications`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Expired Available Now for ${expiredProviders.length} providers`,
        expired: expiredProviders.length,
        providers: expiredProviders.map(p => ({ 
          user_id: p.user_id, 
          username: p.username 
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in expire-available-now function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});