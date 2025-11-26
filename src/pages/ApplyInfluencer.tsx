import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const socialHandleSchema = z.string().trim().max(100, "Handle must be less than 100 characters").optional();

const applicationSchema = z.object({
  application_type: z.enum(["influencer", "affiliate"], {
    required_error: "Please select an application type",
  }),
  instagram: socialHandleSchema,
  tiktok: socialHandleSchema,
  youtube: socialHandleSchema,
  twitter: socialHandleSchema,
  other_platform: z.string().trim().max(50, "Platform name must be less than 50 characters").optional(),
  other_handle: socialHandleSchema,
  audience_size: z.string({
    required_error: "Please select your audience size",
  }),
  application_notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function ApplyInfluencer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      application_type: "influencer",
      instagram: "",
      tiktok: "",
      youtube: "",
      twitter: "",
      other_platform: "",
      other_handle: "",
      audience_size: "",
      application_notes: "",
    },
  });

  const onSubmit = async (values: ApplicationFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to apply");
        navigate("/login");
        return;
      }

      // Check if user already has a pending or approved application
      const { data: existingApp } = await supabase
        .from("influencer_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved"])
        .single();

      if (existingApp) {
        if (existingApp.status === "approved") {
          toast.error("You already have an approved application");
          navigate("/application/status");
        } else {
          toast.error("You already have a pending application");
          navigate("/application/status");
        }
        setLoading(false);
        return;
      }

      // Build social handles object, only including non-empty values
      const socialHandles: Record<string, string> = {};
      if (values.instagram) socialHandles.instagram = values.instagram;
      if (values.tiktok) socialHandles.tiktok = values.tiktok;
      if (values.youtube) socialHandles.youtube = values.youtube;
      if (values.twitter) socialHandles.twitter = values.twitter;
      if (values.other_platform && values.other_handle) {
        socialHandles[values.other_platform] = values.other_handle;
      }

      const { error } = await supabase
        .from("influencer_applications")
        .insert({
          user_id: user.id,
          application_type: values.application_type,
          social_handles: socialHandles,
          audience_size: values.audience_size,
          application_notes: values.application_notes || null,
        });

      if (error) throw error;

      toast.success("Application submitted successfully! We'll review it shortly.");
      navigate("/application/status");
    } catch (error) {
      console.error("Application error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Apply as Influencer or Affiliate
            </CardTitle>
            <CardDescription>
              Join our network and earn commissions by promoting Vairify. Share your social media presence
              and we'll review your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="application_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Type *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="influencer" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <div>
                                <div className="font-semibold">Influencer</div>
                                <div className="text-sm text-muted-foreground">
                                  Content creators with engaged audiences
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="affiliate" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <div>
                                <div className="font-semibold">Affiliate</div>
                                <div className="text-sm text-muted-foreground">
                                  Marketers and promoters earning through referrals
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Social Media Presence</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Provide at least one social media handle where you have an audience
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tiktok"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TikTok</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="youtube"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>YouTube</FormLabel>
                          <FormControl>
                            <Input placeholder="Channel name or handle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X (Twitter)</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="other_platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Platform</FormLabel>
                          <FormControl>
                            <Input placeholder="Platform name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="other_handle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Handle/Username</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="audience_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Audience Size *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your audience size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1k-10k">1K - 10K followers</SelectItem>
                          <SelectItem value="10k-50k">10K - 50K followers</SelectItem>
                          <SelectItem value="50k-100k">50K - 100K followers</SelectItem>
                          <SelectItem value="100k-500k">100K - 500K followers</SelectItem>
                          <SelectItem value="500k-1m">500K - 1M followers</SelectItem>
                          <SelectItem value="1m+">1M+ followers</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Combined total across all platforms
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="application_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your content style, audience demographics, or why you'd be a great fit..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
