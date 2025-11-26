import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Send } from "lucide-react";

export default function EmailTest() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    applicationType: "influencer" as "influencer" | "affiliate",
    status: "approved" as "approved" | "rejected",
    adminNotes: "",
  });

  const handleTest = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to test");
        return;
      }

      // Update the current user's profile with test data
      await supabase
        .from("profiles")
        .update({
          email: formData.email,
          full_name: formData.fullName,
        })
        .eq("id", user.id);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("notify-application-status", {
        body: {
          user_id: user.id,
          application_type: formData.applicationType,
          status: formData.status,
          admin_notes: formData.adminNotes || undefined,
        },
      });

      if (error) throw error;

      toast.success(`Test email sent to ${formData.email}!`);
      console.log("Email response:", data);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  const getEmailPreview = () => {
    const userName = formData.fullName || "Member";
    const appType = formData.applicationType === "influencer" ? "Influencer" : "Affiliate";
    
    if (formData.status === "approved") {
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🎉 Congratulations!</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2>Hi ${userName},</h2>
            <p><span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">APPROVED</span></p>
            <p>Great news! Your application to become a Vairify <strong>${appType}</strong> has been approved!</p>
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Access your referral dashboard to get your unique referral code</li>
              <li>Start sharing Vairify with your audience</li>
              <li>Track your earnings and commissions in real-time</li>
              <li>Enjoy exclusive perks and benefits</li>
            </ul>
            ${formData.adminNotes ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;"><strong>Note from our team:</strong><br/>${formData.adminNotes}</div>` : ""}
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard →</a>
            <p>Thank you for joining our network. We're excited to work with you!</p>
            <p>Best regards,<br/>The Vairify Team</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p>This is an automated message from Vairify</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background: #f3f4f6; color: #374151; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Application Update</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2>Hi ${userName},</h2>
            <p>Thank you for your interest in becoming a Vairify ${appType}.</p>
            <p>After careful review, we're unable to approve your application at this time.</p>
            ${formData.adminNotes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;"><strong>Feedback:</strong><br/>${formData.adminNotes}</div>` : ""}
            <p><strong>You can reapply in the future</strong> as your audience grows or your content strategy evolves. We encourage you to:</p>
            <ul>
              <li>Continue growing your audience and engagement</li>
              <li>Build your presence on relevant platforms</li>
              <li>Consider reapplying after 30 days</li>
            </ul>
            <p>In the meantime, you can still use Vairify's standard referral program and earn commissions by inviting friends.</p>
            <a href="#" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Referral Dashboard</a>
            <p>Thank you for your interest in Vairify.</p>
            <p>Best regards,<br/>The Vairify Team</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
            <p>This is an automated message from Vairify</p>
          </div>
        </div>
      `;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Email Notification Test</CardTitle>
          <CardDescription>
            Test the email notification system by sending a sample application status email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">
                <Send className="w-4 h-4 mr-2" />
                Send Test Email
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview Template
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Test Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationType">Application Type</Label>
            <Select
              value={formData.applicationType}
              onValueChange={(value: "influencer" | "affiliate") =>
                setFormData({ ...formData, applicationType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="influencer">Influencer</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "approved" | "rejected") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Additional notes for the applicant..."
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              rows={3}
            />
          </div>

              <Button onClick={handleTest} disabled={loading || !formData.email || !formData.fullName} className="w-full">
                {loading ? "Sending..." : "Send Test Email"}
              </Button>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Preview:</strong> This is how the email will appear to recipients
                  </p>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={formData.status === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, status: "approved" })}
                    >
                      Approved Template
                    </Button>
                    <Button
                      variant={formData.status === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, status: "rejected" })}
                    >
                      Rejected Template
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-border p-6 overflow-auto">
                  <div 
                    dangerouslySetInnerHTML={{ __html: getEmailPreview() }}
                    className="email-preview"
                  />
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>To:</strong> {formData.email || "test@example.com"}</p>
                  <p><strong>Recipient:</strong> {formData.fullName || "Test User"}</p>
                  <p><strong>Application Type:</strong> {formData.applicationType === "influencer" ? "Influencer" : "Affiliate"}</p>
                  {formData.adminNotes && (
                    <p><strong>Admin Notes:</strong> {formData.adminNotes}</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
