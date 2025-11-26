import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateAccessCodeRequest {
  code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code }: ValidateAccessCodeRequest = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Access code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if access code exists and is valid
    const { data: accessCodeData, error: codeError } = await supabase
      .from('influencer_access_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !accessCodeData) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid or inactive access code' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code has been used
    if (accessCodeData.used_by) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This access code has already been used' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code has expired
    if (accessCodeData.expires_at && new Date(accessCodeData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This access code has expired' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        code: accessCodeData.code,
        influencer_name: accessCodeData.influencer_name,
        message: 'Access code is valid'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-access-code:', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


