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
    // Initialize Supabase client with service role for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      vai_number,
      access_reason, // 'emergency' or 'legal_subpoena'
      requesting_entity, // 'Law Enforcement', 'Court Order #12345', etc.
      authorization_reference, // Case number, court order number, etc.
      access_notes,
      accessed_by_name
    } = await req.json();

    console.log('Emergency retrieval request:', { 
      vai_number, 
      access_reason,
      requesting_entity,
      accessed_by: user.id
    });

    // Validate required fields
    if (!vai_number || !access_reason || !requesting_entity || !authorization_reference) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['vai_number', 'access_reason', 'requesting_entity', 'authorization_reference']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate access reason
    if (!['emergency', 'legal_subpoena'].includes(access_reason)) {
      console.error('Invalid access reason:', access_reason);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid access_reason. Must be "emergency" or "legal_subpoena"'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve VAI verification data including transaction number
    const { data: vaiData, error: vaiError } = await supabaseClient
      .from('vai_verifications')
      .select('*')
      .eq('vai_number', vai_number)
      .single();

    if (vaiError || !vaiData) {
      console.error('VAI verification not found:', vaiError);
      return new Response(
        JSON.stringify({ 
          error: 'VAI verification not found',
          vai_number 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the access to transaction number (critical audit trail)
    const { error: logError } = await supabaseClient
      .from('vai_identity_access_logs')
      .insert({
        vai_number,
        transaction_number: vaiData.complycube_transaction_number,
        access_reason,
        accessed_by_user_id: user.id,
        accessed_by_name: accessed_by_name || user.email,
        requesting_entity,
        authorization_reference,
        access_notes
      });

    if (logError) {
      console.error('Failed to log access:', logError);
      // Continue anyway - we still need to provide the transaction number
      // but log the failure
    }

    console.log('Transaction number retrieved and logged:', {
      vai_number,
      transaction_number: vaiData.complycube_transaction_number,
      access_reason,
      requesting_entity
    });

    // Return the transaction number
    // This transaction number should then be provided to ChainPass
    // ChainPass will use it to request identity data from ComplyCube
    return new Response(
      JSON.stringify({ 
        success: true,
        vai_number,
        transaction_number: vaiData.complycube_transaction_number,
        message: 'Transaction number retrieved successfully. Provide this to ChainPass for identity retrieval.',
        access_logged: !logError,
        instructions: {
          emergency: 'Provide this transaction number to ChainPass. ChainPass will use it to request participant identity information from ComplyCube.',
          legal_subpoena: 'Provide this transaction number to ChainPass in response to the subpoena. ChainPass can then comply with the court order by requesting identity data from ComplyCube.'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in emergency-retrieve-vai-identity:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve VAI identity transaction number'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});