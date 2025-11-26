import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitiateManualVerificationRequest {
  session_id: string;
  failure_reason: 'system_glitch' | 'cant_verify' | 'failed_check';
  failure_details?: string;
  vai_photo_url: string;
  live_selfie_url: string;
  reviewer_user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      session_id,
      failure_reason,
      failure_details,
      vai_photo_url,
      live_selfie_url,
      reviewer_user_id
    }: InitiateManualVerificationRequest = await req.json();

    // Validate input
    if (!session_id || !failure_reason || !vai_photo_url || !live_selfie_url || !reviewer_user_id) {
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

    // Verify session exists and get initiator
    const { data: session, error: sessionError } = await supabase
      .from('vai_check_sessions')
      .select('provider_id, client_id, status')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get initiator user ID from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const initiatorUserId = user.id;

    // Verify reviewer is VAI-verified
    const { data: reviewerVAI, error: vaiError } = await supabase
      .from('vai_verifications')
      .select('user_id')
      .eq('user_id', reviewer_user_id)
      .single();

    if (vaiError || !reviewerVAI) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Reviewer must be VAI-verified to review manual verifications' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reviewer is the other party in the session
    const isProvider = session.provider_id === initiatorUserId;
    const expectedReviewerId = isProvider ? session.client_id : session.provider_id;
    
    if (reviewer_user_id !== expectedReviewerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Reviewer must be the other party in the session' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if manual verification already exists for this session
    const { data: existingVerification } = await supabase
      .from('manual_verifications')
      .select('id')
      .eq('session_id', session_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingVerification) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Manual verification already pending for this session',
          verification_id: existingVerification.id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create manual verification request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    const { data: verification, error: insertError } = await supabase
      .from('manual_verifications')
      .insert({
        session_id,
        initiator_user_id: initiatorUserId,
        reviewer_user_id: reviewer_user_id,
        failure_reason: failure_reason,
        failure_details: failure_details || null,
        vai_photo_url: vai_photo_url,
        live_selfie_url: live_selfie_url,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating manual verification:', insertError);
      throw insertError;
    }

    // Create audit log entry
    await supabase
      .from('verification_audit_log')
      .insert({
        verification_id: verification.id,
        action: 'created',
        user_id: initiatorUserId,
        metadata: {
          failure_reason,
          failure_details,
          session_id
        }
      });

    // TODO: Send notification to reviewer (via notification system or email)

    console.log('✅ Manual verification request created:', verification.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        verification_id: verification.id,
        message: 'Manual verification request created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in initiate-manual-verification:', error);
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


