import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { 
      user_id,
      vai_number,
      biometric_photo_url,
      le_disclosure_accepted,
      signature_agreement_accepted,
      complycube_transaction_number
    } = await req.json();

    console.log('Received VAI verification data from ChainPass:', { 
      user_id, 
      vai_number,
      transaction_number: complycube_transaction_number
    });

    // Validate required fields
    if (!user_id || !vai_number || !biometric_photo_url || !complycube_transaction_number) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate VAI attempts using transaction number
    console.log('Checking for duplicate transaction number...');
    
    const { data: existingVai, error: existingError } = await supabaseClient
      .from('vai_verifications')
      .select('vai_number, user_id')
      .eq('complycube_transaction_number', complycube_transaction_number)
      .maybeSingle();

    if (existingVai) {
      console.error('Duplicate verification attempt detected:', {
        existing_vai: existingVai.vai_number,
        new_user: user_id,
        existing_user: existingVai.user_id
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Duplicate verification attempt detected',
          message: 'This identity has already been verified with a different VAI number',
          existing_vai_number: existingVai.vai_number,
          details: 'This person already has a VAI number in the system'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: Check ComplyCube for additional duplicate detection
    const complycubeApiKey = Deno.env.get('COMPLYCUBE_API_KEY');
    if (complycubeApiKey) {
      console.log('ComplyCube API key found, performing additional duplicate check...');
      
      try {
        // Call ComplyCube API to check for duplicates
        const complycubeResponse = await fetch(
          `https://api.complycube.com/v1/checks`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${complycubeApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'duplicate_check',
              clientId: complycube_transaction_number
            })
          }
        );

        if (complycubeResponse.ok) {
          const duplicateCheck = await complycubeResponse.json();
          console.log('ComplyCube duplicate check result:', duplicateCheck);
          
          if (duplicateCheck.outcome === 'clear') {
            console.log('ComplyCube: No duplicates found');
          } else if (duplicateCheck.outcome === 'attention') {
            console.warn('ComplyCube: Potential duplicate detected', duplicateCheck);
            // Continue but log for review
          }
        } else {
          console.error('ComplyCube API error:', await complycubeResponse.text());
          // Continue anyway - don't block VAI creation if ComplyCube has issues
        }
      } catch (complycubeError) {
        console.error('Error calling ComplyCube:', complycubeError);
        // Continue anyway - don't block VAI creation if ComplyCube has issues
      }
    } else {
      console.warn('ComplyCube API key not configured - skipping additional duplicate check');
    }

    // Insert VAI verification data
    const { data, error } = await supabaseClient
      .from('vai_verifications')
      .insert({
        user_id,
        vai_number,
        biometric_photo_url,
        le_disclosure_accepted: le_disclosure_accepted ?? false,
        signature_agreement_accepted: signature_agreement_accepted ?? false,
        complycube_transaction_number
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting VAI verification:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully stored VAI verification:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'VAI verification stored successfully',
        verification_id: data.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in receive-vai-verification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
