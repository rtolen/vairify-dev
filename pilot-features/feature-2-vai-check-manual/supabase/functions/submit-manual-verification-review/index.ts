import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitReviewRequest {
  verification_id: string;
  decision: 'approved' | 'rejected';
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      verification_id,
      decision,
      notes
    }: SubmitReviewRequest = await req.json();

    // Validate input
    if (!verification_id || !decision) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid decision. Must be "approved" or "rejected"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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

    // Load verification
    const { data: verification, error: verifyError } = await supabase
      .from('manual_verifications')
      .select('*')
      .eq('id', verification_id)
      .single();

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ success: false, error: 'Verification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the reviewer
    if (verification.reviewer_user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - you are not the reviewer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already reviewed
    if (verification.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This verification has already been reviewed',
          current_status: verification.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('manual_verifications')
        .update({ status: 'expired' })
        .eq('id', verification_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This verification request has expired' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if reviewer has given consent
    if (!verification.reviewer_consent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Reviewer consent is required. Please accept the terms first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update verification with review decision
    const { error: updateError } = await supabase
      .from('manual_verifications')
      .update({
        status: decision,
        reviewer_decision: decision,
        reviewer_notes: notes || null,
        reviewer_consent_at: verification.reviewer_consent_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', verification_id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      throw updateError;
    }

    // Create audit log entry
    await supabase
      .from('verification_audit_log')
      .insert({
        verification_id: verification_id,
        action: decision === 'approved' ? 'approved' : 'rejected',
        user_id: user.id,
        metadata: {
          decision,
          notes: notes || null,
          session_id: verification.session_id
        }
      });

    // If approved, update the session with verified status
    if (decision === 'approved') {
      const { error: sessionError } = await supabase
        .from('vai_check_sessions')
        .update({
          status: 'manual_verified',
          manual_verification_id: verification_id
        })
        .eq('id', verification.session_id);

      if (sessionError) {
        console.error('Error updating session:', sessionError);
        // Don't fail the request, just log the error
      }
    }

    // TODO: Send notification to initiator (via notification system or email)

    console.log(`✅ Manual verification review submitted: ${verification_id} - ${decision}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        verification_id: verification_id,
        decision: decision,
        message: `Verification ${decision} successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-manual-verification-review:', error);
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


