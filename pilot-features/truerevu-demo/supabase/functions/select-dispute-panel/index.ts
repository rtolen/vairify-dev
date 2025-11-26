import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SelectPanelRequest {
  dispute_id: string;
  complainant_id: string;
  respondent_id: string;
}

const PANEL_SIZE = {
  clients: 3,
  providers: 3
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      dispute_id,
      complainant_id,
      respondent_id
    }: SelectPanelRequest = await req.json();

    if (!dispute_id || !complainant_id || !respondent_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who are VAI-verified and have completed at least one encounter
    // Exclude complainant and respondent
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type,
        vai_verifications!inner(vai_number)
      `)
      .neq('id', complainant_id)
      .neq('id', respondent_id)
      .not('user_type', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Separate clients and providers
    const clients = allUsers?.filter(u => 
      u.user_type === 'client' || u.user_type === 'both'
    ) || [];
    
    const providers = allUsers?.filter(u => 
      u.user_type === 'provider' || u.user_type === 'both'
    ) || [];

    // Randomly select panel members
    const shuffle = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const selectedClients = shuffle(clients).slice(0, PANEL_SIZE.clients);
    const selectedProviders = shuffle(providers).slice(0, PANEL_SIZE.providers);

    // Check if we have enough members
    if (selectedClients.length < PANEL_SIZE.clients || selectedProviders.length < PANEL_SIZE.providers) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Not enough eligible panel members available' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create panel member records
    const panelMembers = [
      ...selectedClients.map(user => ({
        dispute_id,
        panel_member_id: user.id,
        member_type: 'client' as const,
        status: 'pending' as const
      })),
      ...selectedProviders.map(user => ({
        dispute_id,
        panel_member_id: user.id,
        member_type: 'provider' as const,
        status: 'pending' as const
      }))
    ];

    const { data: createdMembers, error: createError } = await supabase
      .from('dispute_panel_members')
      .insert(panelMembers)
      .select();

    if (createError) {
      console.error('Error creating panel members:', createError);
      throw createError;
    }

    console.log(`✅ Panel selected: ${selectedClients.length} clients, ${selectedProviders.length} providers`);

    return new Response(
      JSON.stringify({ 
        success: true,
        panel_members: createdMembers,
        message: 'Panel members selected successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in select-dispute-panel:', error);
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


