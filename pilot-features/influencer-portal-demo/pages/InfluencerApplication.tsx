import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function InfluencerApplication() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    twitter: "",
    audienceSize: "",
    niche: "",
    whyPartner: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setSubmitting(false);
        return;
      }

      // Validate password strength
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        setSubmitting(false);
        return;
      }

      // Submit application
      const { data, error } = await supabase
        .from('influencer_applications')
        .insert({
          email: formData.email,
          username: formData.username,
          social_links: {
            instagram: formData.instagram || null,
            tiktok: formData.tiktok || null,
            youtube: formData.youtube || null,
            twitter: formData.twitter || null
          },
          audience_size: formData.audienceSize,
          niche: formData.niche,
          why_partner: formData.whyPartner,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Application submitted! We'll review it within 48 hours.");
      
      // TODO: Send confirmation email
      
      navigate("/influencers/application-status", { state: { applicationId: data.id } });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/influencers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Influencer Application</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Apply to Become a Vairify Influencer</CardTitle>
            <CardDescription>
              Help make the adult services industry safer while earning lifetime commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Account Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    required
                    placeholder="yourusername"
                    pattern="[a-z0-9_]+"
                    minLength={3}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Social Media Presence</h3>
                <p className="text-sm text-muted-foreground">
                  Provide at least one social media account
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok Handle</Label>
                    <Input
                      id="tiktok"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <Input
                      id="youtube"
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="Channel name or URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X Handle</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              {/* Audience & Niche */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Audience & Niche</h3>

                <div className="space-y-2">
                  <Label htmlFor="audienceSize">Estimated Audience Size <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.audienceSize}
                    onValueChange={(value) => setFormData({ ...formData, audienceSize: value })}
                    required
                  >
                    <SelectTrigger id="audienceSize">
                      <SelectValue placeholder="Select audience size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1k-10k">1,000 - 10,000</SelectItem>
                      <SelectItem value="10k-50k">10,000 - 50,000</SelectItem>
                      <SelectItem value="50k-100k">50,000 - 100,000</SelectItem>
                      <SelectItem value="100k-500k">100,000 - 500,000</SelectItem>
                      <SelectItem value="500k-1m">500,000 - 1,000,000</SelectItem>
                      <SelectItem value="1m+">1,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche/Category <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.niche}
                    onValueChange={(value) => setFormData({ ...formData, niche: value })}
                    required
                  >
                    <SelectTrigger id="niche">
                      <SelectValue placeholder="Select your niche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult-entertainment">Adult Entertainment</SelectItem>
                      <SelectItem value="dating">Dating & Relationships</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="safety">Safety & Security</SelectItem>
                      <SelectItem value="business">Business & Entrepreneurship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Why Partner */}
              <div className="space-y-2">
                <Label htmlFor="whyPartner">
                  Why do you want to partner with Vairify? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="whyPartner"
                  value={formData.whyPartner}
                  onChange={(e) => setFormData({ ...formData, whyPartner: e.target.value })}
                  required
                  rows={5}
                  placeholder="Tell us about your interest in promoting safety and verification in the adult services industry..."
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.whyPartner.length} / 1000 characters
                </p>
              </div>

              {/* Payment Information Note */}
              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> Payment information will be collected after your application is approved.
                  You'll be able to add PayPal, bank details, or other payment methods in your dashboard.
                </AlertDescription>
              </Alert>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/influencers")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


