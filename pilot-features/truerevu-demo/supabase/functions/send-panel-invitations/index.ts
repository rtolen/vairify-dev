import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvitationsRequest {
  dispute_id: string;
  panel_member_ids: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      dispute_id,
      panel_member_ids
    }: SendInvitationsRequest = await req.json();

    if (!dispute_id || !panel_member_ids || panel_member_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('review_disputes')
      .select('*')
      .eq('id', dispute_id)
      .single();

    if (disputeError || !dispute) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dispute not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get panel member details
    const { data: panelMembers, error: membersError } = await supabase
      .from('dispute_panel_members')
      .select('*, profiles(email, full_name)')
      .in('panel_member_id', panel_member_ids)
      .eq('dispute_id', dispute_id);

    if (membersError || !panelMembers) {
      return new Response(
        JSON.stringify({ success: false, error: 'Panel members not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send invitations (email notifications)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const isTestMode = !RESEND_API_KEY;

    const invitationResults = [];

    for (const member of panelMembers) {
      try {
        // Update invitation sent timestamp
        await supabase
          .from('dispute_panel_members')
          .update({ invitation_sent_at: new Date().toISOString() })
          .eq('id', member.id);

        // Create notification record
        await supabase
          .from('dispute_notifications')
          .insert({
            dispute_id,
            recipient_id: member.panel_member_id,
            notification_type: 'panel_invitation'
          });

        // Send email (if not in test mode)
        if (!isTestMode && member.profiles?.email) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Panel Review Invitation</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2>You've been selected for a Dispute Review Panel</h2>
                  <p>Hello ${member.profiles?.full_name || 'Panel Member'},</p>
                  <p>You have been randomly selected to serve on a dispute review panel for a TrueRevu review dispute.</p>
                  <p><strong>Dispute Reason:</strong> ${dispute.dispute_reason}</p>
                  <p>As a panel member, you will review the case evidence and cast a vote to help resolve this dispute fairly.</p>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Your participation is important!</strong></p>
                    <p>Please log in to your TrueRevu dashboard to review the case and cast your vote.</p>
                  </div>
                  <a href="https://vairify.com/truerevu/disputes/${dispute_id}" 
                     style="display: inline-block; background: #0A1628; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Review Dispute Case
                  </a>
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Thank you for helping maintain the integrity of our review system.
                  </p>
                </div>
              </body>
            </html>
          `;

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Vairify <noreply@vairify.com>',
              to: member.profiles.email,
              subject: 'TrueRevu Dispute Panel Invitation',
              html: emailHtml,
            }),
          });

          if (resendResponse.ok) {
            invitationResults.push({ member_id: member.id, status: 'sent' });
          } else {
            invitationResults.push({ member_id: member.id, status: 'failed' });
          }
        } else {
          console.log(`🧪 TEST MODE: Invitation for panel member ${member.id} (not sent)`);
          invitationResults.push({ member_id: member.id, status: 'test_mode' });
        }
      } catch (error) {
        console.error(`Error sending invitation to member ${member.id}:`, error);
        invitationResults.push({ member_id: member.id, status: 'error' });
      }
    }

    console.log(`✅ Panel invitations sent: ${invitationResults.filter(r => r.status === 'sent' || r.status === 'test_mode').length}/${panelMembers.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        invitations_sent: invitationResults.length,
        results: invitationResults,
        message: 'Panel invitations sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-panel-invitations:', error);
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


