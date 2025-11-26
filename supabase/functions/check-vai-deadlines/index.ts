import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Checking VAI completion deadlines...");

    // Find all users whose VAI deadline has passed and haven't completed VAI
    const { data: expiredUsers, error: fetchError } = await supabase
      .from("referral_codes")
      .select("*")
      .lt("vai_completion_deadline", new Date().toISOString())
      .is("vai_completed_at", null)
      .eq("tier_benefits_active", true)
      .in("tier", ["founding_council", "first_movers", "early_access"]);

    if (fetchError) {
      console.error("Error fetching expired users:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredUsers?.length || 0} users with expired deadlines`);

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No expired deadlines to process",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Revoke tier benefits for users who missed the deadline
    const results = [];
    for (const user of expiredUsers) {
      console.log(`Revoking tier benefits for user ${user.user_id} (tier: ${user.tier})`);
      
      // Update referral_codes to revoke benefits
      const { error: updateError } = await supabase
        .from("referral_codes")
        .update({
          tier_benefits_active: false,
          tier: 'public_standard' // Downgrade to standard tier
        })
        .eq("user_id", user.user_id);

      if (updateError) {
        console.error(`Error updating user ${user.user_id}:`, updateError);
        results.push({ user_id: user.user_id, success: false, error: updateError.message });
        continue;
      }

      // Update profile subscription to free
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_status: "free" })
        .eq("id", user.user_id);

      if (profileError) {
        console.error(`Error updating profile for ${user.user_id}:`, profileError);
      }

      // Send notification to user
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.user_id,
          type: "tier_revoked",
          title: "Tier Benefits Expired",
          message: `Your ${user.tier.replace('_', ' ')} benefits have expired because VAI verification was not completed within 24 hours of registration. You can still use Vairify with the free tier.`,
          metadata: {
            original_tier: user.tier,
            deadline: user.vai_completion_deadline,
            revoked_at: new Date().toISOString()
          }
        });

      if (notifError) {
        console.error(`Error sending notification to ${user.user_id}:`, notifError);
      }

      results.push({ 
        user_id: user.user_id, 
        success: true, 
        tier: user.tier,
        deadline: user.vai_completion_deadline 
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully revoked benefits for ${successCount} users`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${expiredUsers.length} expired deadlines`,
        processed: successCount,
        failed: results.length - successCount,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-vai-deadlines function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});