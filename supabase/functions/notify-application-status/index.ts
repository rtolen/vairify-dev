import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  application_type: "influencer" | "affiliate";
  status: "approved" | "rejected";
  admin_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = new Date().toISOString();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, application_type, status, admin_notes }: NotificationRequest = await req.json();

    console.log(JSON.stringify({
      timestamp: startTime,
      level: "INFO",
      action: "email_notification_start",
      user_id,
      application_type,
      status,
      has_admin_notes: !!admin_notes
    }));

    // Check user notification preferences
    const { data: settings } = await supabase
      .from("user_settings")
      .select("application_status_emails")
      .eq("user_id", user_id)
      .single();

    // If user has disabled application status emails, skip sending
    if (settings && settings.application_status_emails === false) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        action: "email_skipped",
        reason: "user_disabled_notifications",
        user_id
      }));
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    if (profileError || !profile || !profile.email) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "ERROR",
        action: "profile_fetch_failed",
        user_id,
        error: profileError?.message || "Profile or email missing"
      }));
      throw new Error("User profile not found or email missing");
    }

    const userName = profile.full_name || "Member";
    const userEmail = profile.email;

    // Build email content based on status
    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = `🎉 Your ${application_type === "influencer" ? "Influencer" : "Affiliate"} Application Has Been Approved!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <h2>Hi ${userName},</h2>
                <p><span class="badge">APPROVED</span></p>
                <p>Great news! Your application to become a Vairify <strong>${application_type === "influencer" ? "Influencer" : "Affiliate"}</strong> has been approved!</p>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Access your referral dashboard to get your unique referral code</li>
                  <li>Start sharing Vairify with your audience</li>
                  <li>Track your earnings and commissions in real-time</li>
                  <li>Enjoy exclusive perks and benefits</li>
                </ul>
                
                ${admin_notes ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;"><strong>Note from our team:</strong><br/>${admin_notes}</div>` : ""}
                
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/referrals" class="button">Go to Dashboard →</a>
                
                <p>Thank you for joining our network. We're excited to work with you!</p>
                
                <p>Best regards,<br/>The Vairify Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message from Vairify</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `Update on Your ${application_type === "influencer" ? "Influencer" : "Affiliate"} Application`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f3f4f6; color: #374151; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Application Update</h1>
              </div>
              <div class="content">
                <h2>Hi ${userName},</h2>
                
                <p>Thank you for your interest in becoming a Vairify ${application_type === "influencer" ? "Influencer" : "Affiliate"}.</p>
                
                <p>After careful review, we're unable to approve your application at this time.</p>
                
                ${admin_notes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;"><strong>Feedback:</strong><br/>${admin_notes}</div>` : ""}
                
                <p><strong>You can reapply in the future</strong> as your audience grows or your content strategy evolves. We encourage you to:</p>
                <ul>
                  <li>Continue growing your audience and engagement</li>
                  <li>Build your presence on relevant platforms</li>
                  <li>Consider reapplying after 30 days</li>
                </ul>
                
                <p>In the meantime, you can still use Vairify's standard referral program and earn commissions by inviting friends.</p>
                
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/referrals" class="button">View Referral Dashboard</a>
                
                <p>Thank you for your interest in Vairify.</p>
                
                <p>Best regards,<br/>The Vairify Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message from Vairify</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Vairify <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "SUCCESS",
      action: "email_sent",
      user_id,
      email: userEmail,
      application_type,
      status,
      resend_id: emailResponse.data?.id,
      duration_ms: Date.now() - new Date(startTime).getTime()
    }));

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      action: "email_send_failed",
      error_message: error.message,
      error_stack: error.stack,
      duration_ms: Date.now() - new Date(startTime).getTime()
    }));
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
