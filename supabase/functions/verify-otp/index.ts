import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface VerifyRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests FIRST - before any initialization
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Initialize clients after OPTIONS check
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const { email, otp }: VerifyRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Verifying OTP for:', email);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the verification record
    const { data: verification, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !verification) {
      console.error('Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: "Verification code not found. Please request a new code.",
          code: "NOT_FOUND"
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified - if so, return success (OTP was correct before)
    if (verification.verified) {
      console.log('Email already verified - returning success');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email already verified"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    if (now > expiresAt) {
      console.log('OTP expired');
      return new Response(
        JSON.stringify({ 
          error: "Verification code expired. Please request a new code.",
          code: "EXPIRED"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempt limit (max 5 attempts)
    if (verification.attempts >= 5) {
      console.log('Too many attempts');
      return new Response(
        JSON.stringify({ 
          error: "Too many failed attempts. Please request a new code.",
          code: "TOO_MANY_ATTEMPTS"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP
    if (verification.otp_code !== otp) {
      // Increment attempt counter
      await supabase
        .from('email_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('email', email.toLowerCase());

      console.log('Invalid OTP');
      return new Response(
        JSON.stringify({ 
          error: "Invalid verification code",
          code: "INVALID_OTP",
          attemptsRemaining: 5 - (verification.attempts + 1)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('Failed to mark as verified:', updateError);
      throw new Error('Failed to complete verification');
    }

    console.log('OTP verified successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email verified successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to verify code",
        code: "SERVER_ERROR"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
