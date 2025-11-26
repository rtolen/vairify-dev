import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateEncounterRequest {
  session_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id }: CreateEncounterRequest = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing session_id' }),
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

    // Load session
    const { data: session, error: sessionError } = await supabase
      .from('vai_check_sessions')
      .select('provider_id, client_id, status, encounter_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is part of this session
    if (session.provider_id !== user.id && session.client_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - not part of this session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, error: 'Session must be completed before creating encounter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if encounter already exists
    if (session.encounter_id) {
      const { data: existingEncounter } = await supabase
        .from('encounters')
        .select('id')
        .eq('id', session.encounter_id)
        .single();

      if (existingEncounter) {
        return new Response(
          JSON.stringify({ 
            success: true,
            encounter_id: existingEncounter.id,
            message: 'Encounter already exists'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify both parties have completed verification
    const { data: sessionFull } = await supabase
      .from('vai_check_sessions')
      .select('provider_verified, client_verified, provider_id, client_id')
      .eq('id', session_id)
      .single();

    if (!sessionFull?.provider_verified || !sessionFull?.client_verified) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Both parties must complete verification before creating encounter' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create encounter
    const { data: encounter, error: encounterError } = await supabase
      .from('encounters')
      .insert({
        session_id: session_id,
        provider_id: sessionFull.provider_id,
        client_id: sessionFull.client_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        reviews_window_open: true,
        dateguard_window_open: true
      })
      .select()
      .single();

    if (encounterError) {
      console.error('Error creating encounter:', encounterError);
      throw encounterError;
    }

    // Update session with encounter_id
    await supabase
      .from('vai_check_sessions')
      .update({ encounter_id: encounter.id })
      .eq('id', session_id);

    console.log('✅ Encounter created:', encounter.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        encounter_id: encounter.id,
        message: 'Encounter created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-encounter:', error);
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


