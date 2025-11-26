import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReferralEmailRequest {
  invitation_id: string;
  to_email: string;
  referrer_name?: string;
  referral_code?: string;
  custom_code?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      invitation_id,
      to_email,
      referrer_name,
      referral_code,
      custom_code,
      message
    }: SendReferralEmailRequest = await req.json();

    if (!invitation_id || !to_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: invitation_id, to_email' }),
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

    // Get invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('referral_invitations')
      .select('*')
      .eq('id', invitation_id)
      .eq('referrer_id', user.id)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const isTestMode = !RESEND_API_KEY;

    // Build referral link
    const codeToUse = custom_code || referral_code;
    if (!codeToUse) {
      return new Response(
        JSON.stringify({ success: false, error: 'No referral code found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referralLink = `https://vairify.com/join/${codeToUse}`;
    const referrerDisplayName = referrer_name || 'A friend';

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join Vairify</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0A1628 0%, #1E40AF 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Join Vairify</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">The safest platform for adult services</p>
          </div>
          
          <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">
              Hi there,
            </p>
            
            <p style="font-size: 16px; margin: 0 0 20px 0;">
              ${referrerDisplayName} has invited you to join Vairify - the verified safety platform for adult services.
            </p>
            
            ${message ? `<p style="font-size: 16px; margin: 0 0 20px 0; font-style: italic; color: #666;">"${message}"</p>` : ''}
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; border: 2px solid #e5e7eb;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #0A1628;">Get 20% Off Your First Month</h2>
              <p style="margin: 0 0 25px 0; color: #666;">Use this referral code when you sign up:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 25px;">
                <code style="font-size: 24px; font-weight: bold; color: #0A1628; letter-spacing: 2px;">${codeToUse}</code>
              </div>
              <a href="${referralLink}" style="display: inline-block; background: linear-gradient(135deg, #0A1628 0%, #1E40AF 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Join Vairify Now →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
              This invitation was sent by ${referrerDisplayName}. If you didn't expect this email, you can safely ignore it.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; margin: 0;">
              Vairify • Verified Safety Platform<br>
              <a href="https://vairify.com" style="color: #1E40AF;">vairify.com</a>
            </p>
          </div>
        </body>
      </html>
    `;

    if (isTestMode) {
      console.log(`🧪 TEST MODE: Email NOT sent`);
      console.log(`To: ${to_email}`);
      console.log(`Subject: Join Vairify - Get 20% Off`);
      console.log(`Referral Link: ${referralLink}`);
      console.log(`Code: ${codeToUse}`);

      // Update invitation with test mode status
      await supabase
        .from('referral_invitations')
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          delivery_error: 'TEST MODE - Email not actually sent'
        })
        .eq('id', invitation_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged in test mode (not sent)',
          sent: false,
          test_mode: true,
          referral_link: referralLink
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend API
    const resendUrl = 'https://api.resend.com/emails';
    const resendResponse = await fetch(resendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vairify <noreply@vairify.com>',
        to: to_email,
        subject: 'Join Vairify - Get 20% Off',
        html: emailHtml,
        headers: {
          'X-Entity-Ref-ID': invitation_id,
        },
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);

      // Update invitation with failure status
      await supabase
        .from('referral_invitations')
        .update({
          delivery_status: 'failed',
          sent_at: new Date().toISOString(),
          delivery_error: resendData.message || 'Failed to send email via Resend'
        })
        .eq('id', invitation_id);

      throw new Error(resendData.message || 'Failed to send email via Resend');
    }

    // Update invitation with success status
    await supabase
      .from('referral_invitations')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        delivery_error: null
      })
      .eq('id', invitation_id);

    console.log('✅ Email sent successfully via Resend:', resendData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        sent: true,
        resend_id: resendData.id,
        referral_link: referralLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-referral-email:', error);
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


