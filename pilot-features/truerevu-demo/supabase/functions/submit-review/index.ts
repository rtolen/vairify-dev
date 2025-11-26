import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitReviewRequest {
  encounter_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  reviewer_vai_number: string;
  reviewee_vai_number: string;
  punctuality_rating?: number;
  communication_rating?: number;
  respectfulness_rating?: number;
  attitude_rating?: number;
  accuracy_rating?: number;
  safety_rating?: number;
  overall_rating: number;
  review_text?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      encounter_id,
      reviewer_id,
      reviewed_user_id,
      reviewer_vai_number,
      reviewee_vai_number,
      punctuality_rating,
      communication_rating,
      respectfulness_rating,
      attitude_rating,
      accuracy_rating,
      safety_rating,
      overall_rating,
      review_text
    }: SubmitReviewRequest = await req.json();

    // Validate required fields
    if (!encounter_id || !reviewer_id || !reviewed_user_id || !reviewer_vai_number || !reviewee_vai_number || !overall_rating) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate overall rating
    if (overall_rating < 1 || overall_rating > 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Overall rating must be between 1 and 5' }),
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

    // Verify reviewer_id matches authenticated user
    if (reviewer_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reviewer ID does not match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load encounter
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .select('*')
      .eq('id', encounter_id)
      .single();

    if (encounterError || !encounter) {
      return new Response(
        JSON.stringify({ success: false, error: 'Encounter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is part of this encounter
    if (encounter.provider_id !== user.id && encounter.client_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - not part of this encounter' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check mutual verification requirement using database function
    const { data: canSubmit, error: canSubmitError } = await supabase
      .rpc('can_submit_review', {
        p_encounter_id: encounter_id,
        p_reviewer_id: user.id
      });

    if (canSubmitError || !canSubmit) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot submit review. Both parties must complete the encounter first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('encounter_id', encounter_id)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You have already submitted a review for this encounter' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reviewer and reviewee VAI numbers exist
    const { data: reviewerVAI } = await supabase
      .from('vai_verifications')
      .select('vai_number')
      .eq('vai_number', reviewer_vai_number)
      .eq('user_id', reviewer_id)
      .single();

    const { data: revieweeVAI } = await supabase
      .from('vai_verifications')
      .select('vai_number')
      .eq('vai_number', reviewee_vai_number)
      .eq('user_id', reviewed_user_id)
      .single();

    if (!reviewerVAI || !revieweeVAI) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Both parties must be VAI-verified to submit reviews' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        encounter_id: encounter_id,
        reviewer_id: reviewer_id,
        reviewed_user_id: reviewed_user_id,
        reviewer_vai_number: reviewer_vai_number,
        reviewee_vai_number: reviewee_vai_number,
        punctuality_rating: punctuality_rating || null,
        communication_rating: communication_rating || null,
        respectfulness_rating: respectfulness_rating || null,
        attitude_rating: attitude_rating || null,
        accuracy_rating: accuracy_rating || null,
        safety_rating: safety_rating || null,
        overall_rating: overall_rating,
        notes: review_text || null,
        submitted: true,
        submitted_at: new Date().toISOString(),
        is_verified: true,
        mutual_completion_verified: true
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      throw reviewError;
    }

    // Update encounter to track review submission
    const isProvider = encounter.provider_id === user.id;
    const updateData: any = {};
    if (isProvider) {
      updateData.provider_review_submitted = true;
    } else {
      updateData.client_review_submitted = true;
    }

    // Check if both reviews are submitted
    const { data: updatedEncounter } = await supabase
      .from('encounters')
      .update(updateData)
      .eq('id', encounter_id)
      .select()
      .single();

    if (updatedEncounter?.provider_review_submitted && updatedEncounter?.client_review_submitted) {
      // Both reviews submitted
      await supabase
        .from('encounters')
        .update({
          both_reviews_submitted_at: new Date().toISOString()
        })
        .eq('id', encounter_id);
    }

    console.log('✅ Review submitted:', review.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        review_id: review.id,
        message: 'Review submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-review:', error);
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


