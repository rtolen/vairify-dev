import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPayoutRequest {
  influencer_id: string;
  amount: number;
  payment_method: string;
}

const MINIMUM_PAYOUT = 50.00;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      influencer_id,
      amount,
      payment_method
    }: ProcessPayoutRequest = await req.json();

    if (!influencer_id || !amount || !payment_method) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum threshold
    if (amount < MINIMUM_PAYOUT) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Minimum payout is $${MINIMUM_PAYOUT}. You requested $${amount.toFixed(2)}.` 
        }),
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

    // Verify influencer exists and user owns it
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencer_id)
      .eq('user_id', user.id)
      .single();

    if (influencerError || !influencer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Influencer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check available balance
    const availableBalance = parseFloat(influencer.total_earnings?.toString() || '0') - 
                            parseFloat(influencer.pending_payout?.toString() || '0');

    if (amount > availableBalance) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('influencer_payouts')
      .insert({
        influencer_id: influencer_id,
        amount: amount,
        status: 'pending',
        payment_method: payment_method,
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      throw payoutError;
    }

    // Update influencer pending_payout
    await supabase
      .from('influencers')
      .update({
        pending_payout: parseFloat(influencer.pending_payout?.toString() || '0') + amount
      })
      .eq('id', influencer_id);

    // TODO: Send notification to admin for approval

    console.log('✅ Payout request created:', payout.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        payout_id: payout.id,
        message: 'Payout request submitted. Admin will review and process within 3-5 business days.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-influencer-payout:', error);
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


