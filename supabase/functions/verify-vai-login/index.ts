import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaiNumber, faceImageBase64 } = await req.json();
    const origin = req.headers.get('origin') || '';
    const isDevTest = origin.includes('devtest');
    
    console.log('VAI login verification - Environment:', isDevTest ? 'devtest' : 'production');

    if (!vaiNumber || !faceImageBase64) {
      return new Response(
        JSON.stringify({ error: 'VAI number and face image are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('Looking up VAI number:', vaiNumber);

    // Look up the VAI verification record
    const { data: verification, error: lookupError } = await supabaseAdmin
      .from('vai_verifications')
      .select('user_id, biometric_photo_url, vai_number')
      .eq('vai_number', vaiNumber.toUpperCase())
      .single();

    if (lookupError || !verification) {
      console.error('VAI lookup error:', lookupError);
      return new Response(
        JSON.stringify({ error: 'Invalid V.A.I. number' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('VAI found for user:', verification.user_id);

    // If face verification is provided, verify against stored biometric
    if (faceImageBase64) {
      console.log('Verifying face biometrics...');
      
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      // Use Lovable AI to compare the faces
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a biometric face verification system. Compare the two face images provided and determine if they are the same person. Respond with only "MATCH" if they are the same person with high confidence, or "NO_MATCH" if they are different people or if you cannot determine with high confidence.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Compare these two faces and determine if they are the same person. The first image is the stored biometric from verification, the second is the live capture.'
                },
                {
                  type: 'image_url',
                  image_url: { url: verification.biometric_photo_url }
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${faceImageBase64}` }
                }
              ]
            }
          ],
          max_tokens: 10
        })
      });

      if (!aiResponse.ok) {
        console.error('AI face verification failed:', await aiResponse.text());
        return new Response(
          JSON.stringify({ error: 'Face verification service unavailable' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiResult = await aiResponse.json();
      const verificationResult = aiResult.choices?.[0]?.message?.content?.trim();
      
      console.log('Face verification result:', verificationResult);

      if (verificationResult !== 'MATCH') {
        // Determine failure reason
        let failureReason: 'system_glitch' | 'cant_verify' | 'failed_check' = 'failed_check';
        let failureDetails = 'Face verification failed - photos did not match';

        // Check if it's a system/technical issue
        if (!aiResponse.ok || !verificationResult) {
          failureReason = 'system_glitch';
          failureDetails = 'Face verification service unavailable or returned invalid response';
        } else if (verificationResult === 'NO_MATCH') {
          failureReason = 'failed_check';
          failureDetails = 'Face verification failed - photos did not match stored biometric';
        }

        return new Response(
          JSON.stringify({ 
            error: 'Face verification failed. Please try again or use email login.',
            verification_failed: true,
            failure_reason: failureReason,
            failure_details: failureDetails,
            can_use_manual_verification: true
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user email for session creation
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      verification.user_id
    );

    if (userError || !authUser.user || !authUser.user.email) {
      console.error('User lookup error:', userError);
      return new Response(
        JSON.stringify({ error: 'User account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating session for user:', authUser.user.email);

    // Generate session URL with environment-aware redirect
    const vairifyBaseUrl = isDevTest ? 'https://devtest.vairify.io' : 'https://vairify.io';
    
    // Create a session for the user using admin API
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email,
      options: {
        redirectTo: `${vairifyBaseUrl}/pricing`
      }
    });

    if (sessionError || !sessionData) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session generated for environment:', vairifyBaseUrl);

    // Check if user has completed profile
    const { data: profile } = await supabaseAdmin
      .from('provider_profiles')
      .select('username')
      .eq('user_id', verification.user_id)
      .single();

    const hasProfile = !!profile?.username;

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionUrl: sessionData.properties.action_link,
        hasProfile,
        userId: verification.user_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('VAI login error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
