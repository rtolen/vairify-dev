import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInfluencerRequest {
  access_code: string;
  email: string;
  username: string;
  password: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      access_code,
      email,
      username,
      password
    }: CreateInfluencerRequest = await req.json();

    if (!access_code || !email || !username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate access code again
    const { data: accessCodeData, error: codeError } = await supabase
      .from('influencer_access_codes')
      .select('*')
      .eq('code', access_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !accessCodeData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid access code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (accessCodeData.used_by) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access code already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email or username already exists
    const { data: existingEmail } = await supabase
      .from('influencers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email already registered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingUsername } = await supabase
      .from('influencers')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUsername) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username already taken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for access code users
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      throw new Error('Failed to create user account');
    }

    // Hash password (for storage in influencers table - though we use Supabase Auth)
    // In production, you might want to store a hash or just rely on Supabase Auth
    const passwordHash = 'stored_in_supabase_auth'; // Placeholder

    // Create influencer record
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .insert({
        user_id: authData.user.id,
        email,
        username: username.toLowerCase(),
        password_hash: passwordHash,
        status: 'approved', // Auto-approve for access code users
        access_code: access_code.toUpperCase(),
        approved_at: new Date().toISOString(),
        commission_rate: 0.10 // Default 10%
      })
      .select()
      .single();

    if (influencerError) {
      console.error('Error creating influencer:', influencerError);
      // Clean up auth user if influencer creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw influencerError;
    }

    // Mark access code as used
    await supabase
      .from('influencer_access_codes')
      .update({
        used_by: influencer.id,
        used_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', accessCodeData.id);

    console.log('✅ Influencer created from access code:', influencer.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        influencer_id: influencer.id,
        user_id: authData.user.id,
        message: 'Influencer account created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-influencer-from-access-code:', error);
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


