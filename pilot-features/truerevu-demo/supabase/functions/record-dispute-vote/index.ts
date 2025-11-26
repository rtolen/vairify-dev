import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecordVoteRequest {
  dispute_id: string;
  vote_decision: 'favor_complainant' | 'favor_respondent' | 'no_decision';
}

// Simple encryption for demo (use proper encryption in production)
function encryptVote(decision: string, memberId: string, disputeId: string): { encrypted: string; hash: string } {
  const data = `${decision}:${memberId}:${disputeId}:${Date.now()}`;
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  // Simple hash for demo (use proper encryption in production)
  const hash = Array.from(dataBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // In production, use proper encryption (e.g., AES-256)
  const encrypted = btoa(data); // Base64 encoding for demo
  
  return { encrypted, hash };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      dispute_id,
      vote_decision
    }: RecordVoteRequest = await req.json();

    if (!dispute_id || !vote_decision) {
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
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is a panel member for this dispute
    const { data: panelMember, error: memberError } = await supabase
      .from('dispute_panel_members')
      .select('*')
      .eq('dispute_id', dispute_id)
      .eq('panel_member_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (memberError || !panelMember) {
      return new Response(
        JSON.stringify({ success: false, error: 'You are not an accepted panel member for this dispute' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('dispute_votes')
      .select('id')
      .eq('dispute_id', dispute_id)
      .eq('panel_member_id', user.id)
      .maybeSingle();

    if (existingVote) {
      return new Response(
        JSON.stringify({ success: false, error: 'You have already voted on this dispute' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt vote
    const { encrypted, hash } = encryptVote(vote_decision, user.id, dispute_id);

    // Record vote
    const { data: vote, error: voteError } = await supabase
      .from('dispute_votes')
      .insert({
        dispute_id,
        panel_member_id: user.id,
        vote_decision,
        vote_encrypted: encrypted,
        vote_hash: hash
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error recording vote:', voteError);
      throw voteError;
    }

    // Update panel member status
    await supabase
      .from('dispute_panel_members')
      .update({ status: 'completed' })
      .eq('id', panelMember.id);

    // Check if all votes are in
    const { data: allVotes } = await supabase
      .from('dispute_votes')
      .select('id')
      .eq('dispute_id', dispute_id);

    const { data: allMembers } = await supabase
      .from('dispute_panel_members')
      .select('id')
      .eq('dispute_id', dispute_id)
      .eq('status', 'accepted');

    // If all votes are in, update dispute status
    if (allVotes && allMembers && allVotes.length >= allMembers.length) {
      await supabase
        .from('review_disputes')
        .update({ status: 'voting' })
        .eq('id', dispute_id);

      // Trigger outcome processing (admin will review and finalize)
      // This could be automated or require admin review
    }

    console.log('✅ Vote recorded:', vote.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        vote_id: vote.id,
        message: 'Vote recorded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in record-dispute-vote:', error);
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


