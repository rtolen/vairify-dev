import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDisputeRequest {
  review_id: string;
  complainant_id: string;
  respondent_id: string;
  dispute_reason: 'inaccurate' | 'false' | 'defamatory';
  statement: string;
  evidence_urls: string[];
  dm_attachments: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      review_id,
      complainant_id,
      respondent_id,
      dispute_reason,
      statement,
      evidence_urls,
      dm_attachments
    }: CreateDisputeRequest = await req.json();

    if (!review_id || !complainant_id || !respondent_id || !dispute_reason || !statement) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
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
    if (userError || !user || user.id !== complainant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify review exists and complainant is the reviewed user
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('reviewed_user_id')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return new Response(
        JSON.stringify({ success: false, error: 'Review not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (review.reviewed_user_id !== complainant_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You can only dispute reviews about yourself' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('review_disputes')
      .select('id')
      .eq('review_id', review_id)
      .eq('complainant_id', complainant_id)
      .maybeSingle();

    if (existingDispute) {
      return new Response(
        JSON.stringify({ success: false, error: 'You have already filed a dispute for this review' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('review_disputes')
      .insert({
        review_id,
        complainant_id,
        respondent_id,
        dispute_reason,
        statement,
        evidence_urls: evidence_urls || [],
        dm_attachments: dm_attachments || [],
        status: 'pending_panel'
      })
      .select()
      .single();

    if (disputeError) {
      console.error('Error creating dispute:', disputeError);
      throw disputeError;
    }

    // Select panel members (3 clients + 3 providers)
    const { data: panelData, error: panelError } = await supabase.functions.invoke('select-dispute-panel', {
      body: {
        dispute_id: dispute.id,
        complainant_id,
        respondent_id
      }
    });

    if (panelError || !panelData?.success) {
      console.error('Error selecting panel:', panelError);
      // Continue even if panel selection fails - can be retried
    }

    // Send panel invitations
    if (panelData?.panel_members) {
      await supabase.functions.invoke('send-panel-invitations', {
        body: {
          dispute_id: dispute.id,
          panel_member_ids: panelData.panel_members.map((m: any) => m.id)
        }
      });
    }

    // Update dispute status
    await supabase
      .from('review_disputes')
      .update({ status: 'panel_review' })
      .eq('id', dispute.id);

    console.log('✅ Dispute created:', dispute.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        dispute_id: dispute.id,
        message: 'Dispute filed successfully. Panel members have been notified.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-dispute:', error);
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


