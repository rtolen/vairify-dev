import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckVAIRequirementsRequest {
  vai_number: string;
  session_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vai_number, session_id }: CheckVAIRequirementsRequest = await req.json();

    if (!vai_number) {
      return new Response(
        JSON.stringify({ success: false, error: 'VAI number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ChainPass API configuration
    const CHAINPASS_API_URL = Deno.env.get('CHAINPASS_API_URL') || 'https://api.chainpass.com';
    const CHAINPASS_API_KEY = Deno.env.get('CHAINPASS_API_KEY');

    if (!CHAINPASS_API_KEY) {
      console.warn('⚠️ CHAINPASS_API_KEY not configured - using test mode');
    }

    // Call ChainPass API endpoint
    const chainpassUrl = `${CHAINPASS_API_URL}/check-vai-requirements`;
    
    let chainpassResponse;
    let chainpassData;

    if (!CHAINPASS_API_KEY) {
      // Test mode - return mock response
      console.log('🧪 TEST MODE: Mock ChainPass response for VAI:', vai_number);
      chainpassData = {
        vai_number: vai_number,
        status: 'fully_qualified', // or 'missing_requirements' or 'invalid'
        fully_qualified: true,
        missing_requirements: [],
        payment_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        requirements_status: {
          le_disclosure: true,
          signature: true,
          payment: true,
          kyc: true
        }
      };
    } else {
      // Real API call
      try {
        chainpassResponse = await fetch(chainpassUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHAINPASS_API_KEY}`,
          },
          body: JSON.stringify({ vai_number }),
        });

        if (!chainpassResponse.ok) {
          const errorText = await chainpassResponse.text();
          console.error('ChainPass API error:', errorText);
          throw new Error(`ChainPass API error: ${chainpassResponse.status}`);
        }

        chainpassData = await chainpassResponse.json();
      } catch (error) {
        console.error('Error calling ChainPass API:', error);
        throw error;
      }
    }

    // Determine status
    let vaiStatus: 'fully_qualified' | 'missing_requirements' | 'invalid' = 'invalid';
    
    if (chainpassData.status === 'fully_qualified' || chainpassData.fully_qualified === true) {
      vaiStatus = 'fully_qualified';
    } else if (chainpassData.missing_requirements && chainpassData.missing_requirements.length > 0) {
      vaiStatus = 'missing_requirements';
    } else if (chainpassData.status === 'invalid' || chainpassData.valid === false) {
      vaiStatus = 'invalid';
    }

    // Update session if session_id provided
    if (session_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('signup_sessions')
        .update({
          existing_vai_number: vai_number,
          chainpass_response: chainpassData,
          vai_status: vaiStatus,
          payment_expiration: chainpassData.payment_expiration ? new Date(chainpassData.payment_expiration).toISOString() : null,
          requirements_status: chainpassData.requirements_status || {}
        })
        .eq('session_id', session_id);
    }

    console.log(`✅ VAI check completed: ${vai_number} - Status: ${vaiStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        vai_number: vai_number,
        status: vaiStatus,
        fully_qualified: vaiStatus === 'fully_qualified',
        missing_requirements: chainpassData.missing_requirements || [],
        payment_expiration: chainpassData.payment_expiration,
        requirements_status: chainpassData.requirements_status || {},
        chainpass_response: chainpassData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-vai-requirements:', error);
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


