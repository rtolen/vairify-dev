import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { BasicInfoStep } from "@/components/profile/BasicInfoStep";
import { PhysicalServicesStep } from "@/components/profile/PhysicalServicesStep";
import { SettingsReviewStep } from "@/components/profile/SettingsReviewStep";
import { PaymentSetupStep } from "@/components/profile/PaymentSetupStep";
import { useProviderProfile, type ProviderProfile } from "@/hooks/useProviderProfile";
import { toast } from "sonner";
import { TierBadge } from "@/components/profile/TierBadge";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  
  // Profile photo
  avatarUrl: z.string().optional(),
  
  // Gallery photos
  publicGallery: z.array(z.object({
    id: z.string(),
    url: z.string(),
    order: z.number(),
  })).default([]),
  membersGallery: z.array(z.object({
    id: z.string(),
    url: z.string(),
    order: z.number(),
  })).default([]),
  
  // Physical attributes (all optional)
  height: z.string().optional(),
  weight: z.string().optional(),
  hairColor: z.string().optional(),
  hairLength: z.string().optional(),
  eyeColor: z.string().optional(),
  bodyType: z.string().optional(),
  ethnicity: z.string().optional(),
  ageRange: z.string().optional(),
  
  // Services and add-ons
  servicesOffered: z.array(z.string()).default([]),
  addOns: z.array(z.string()).default([]),
  
  // Availability
  acceptingClients: z.boolean().default(true),
  outcalls: z.boolean().default(false),
  incalls: z.boolean().default(false),
  tours: z.boolean().default(true),
  
  // Profile settings
  visibleInDirectory: z.boolean().default(true),
  allowDirectBooking: z.boolean().default(true),
  showOnlineStatus: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfileCreation() {
  const navigate = useNavigate();
  const { profile, loading, saving, saveProfile } = useProviderProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      avatarUrl: "",
      publicGallery: [],
      membersGallery: [],
      servicesOffered: [],
      addOns: [],
      acceptingClients: true,
      outcalls: false,
      incalls: false,
      tours: true,
      visibleInDirectory: true,
      allowDirectBooking: true,
      showOnlineStatus: false,
    },
  });

  const watchedValues = form.watch();
  const [userTier, setUserTier] = useState<'founding_council' | 'first_movers' | 'early_access' | 'standard' | null>(null);

  // Check user tier from database
  useEffect(() => {
    const checkTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      if (referralCode?.tier) {
        setUserTier(referralCode.tier as any);
      }
    };
    checkTier();
  }, []);

  // Load existing profile data if available
  useEffect(() => {
    if (profile && !loading) {
      // Populate form with existing data
      form.reset({
        username: profile.username,
        avatarUrl: profile.avatar_url || "",
        publicGallery: profile.public_gallery || [],
        membersGallery: profile.members_gallery || [],
        height: profile.height || "",
        weight: profile.weight || "",
        hairColor: profile.hair_color || "",
        hairLength: profile.hair_length || "",
        eyeColor: profile.eye_color || "",
        bodyType: profile.body_type || "",
        ethnicity: profile.ethnicity || "",
        ageRange: profile.age_range || "",
        servicesOffered: profile.services_offered || [],
        addOns: profile.add_ons || [],
        acceptingClients: profile.availability?.acceptingClients ?? true,
        outcalls: profile.availability?.outcalls ?? false,
        incalls: profile.availability?.incalls ?? false,
        tours: profile.availability?.tours ?? true,
        visibleInDirectory: profile.profile_settings?.visibleInDirectory ?? true,
        allowDirectBooking: profile.profile_settings?.allowDirectBooking ?? true,
        showOnlineStatus: profile.profile_settings?.showOnlineStatus ?? false,
      });
    }
  }, [profile, loading, form]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const formData = form.getValues();
      localStorage.setItem("vairify_profile_draft", JSON.stringify(formData));
    }, 30000);

    return () => clearInterval(interval);
  }, [form]);

  // Calculate completion percentage
  useEffect(() => {
    const values = form.getValues();
    let filled = 0;
    const totalFields = 20;

    if (values.username) filled++;
    if (values.avatarUrl) filled += 2; // Worth more because it's important
    if (values.publicGallery.length > 0) filled += 2;
    if (values.membersGallery.length > 0) filled += 2;
    if (values.height) filled++;
    if (values.height) filled++;
    if (values.weight) filled++;
    if (values.hairColor) filled++;
    if (values.hairLength) filled++;
    if (values.eyeColor) filled++;
    if (values.bodyType) filled++;
    if (values.ethnicity) filled++;
    if (values.ageRange) filled++;
    if (values.servicesOffered.length > 0) filled += 3;
    if (values.addOns.length > 0) filled += 2;
    filled += 5; // For toggles (always have values)

    setCompletionPercentage(Math.round((filled / totalFields) * 100));
  }, [watchedValues, form]);

  // Check if username is valid for navigation
  const canProceed = () => {
    if (currentStep === 1) {
      const username = form.getValues("username");
      return username && username.length >= 3 && username.length <= 20;
    }
    return true;
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.username || data.username.trim().length < 3) {
      toast.error("Username is required and must be at least 3 characters");
      setCurrentStep(1); // Go back to first step where username is
      return;
    }

    // Transform form data to profile format
    const profileData: Partial<ProviderProfile> = {
      username: data.username.trim(),
      avatar_url: data.avatarUrl,
      public_gallery: data.publicGallery.map(p => ({ id: p.id!, url: p.url!, order: p.order! })),
      members_gallery: data.membersGallery.map(p => ({ id: p.id!, url: p.url!, order: p.order! })),
      height: data.height,
      weight: data.weight,
      hair_color: data.hairColor,
      hair_length: data.hairLength,
      eye_color: data.eyeColor,
      body_type: data.bodyType,
      ethnicity: data.ethnicity,
      age_range: data.ageRange,
      services_offered: data.servicesOffered,
      add_ons: data.addOns,
      availability: {
        acceptingClients: data.acceptingClients,
        outcalls: data.outcalls,
        incalls: data.incalls,
        tours: data.tours,
      },
      profile_settings: {
        visibleInDirectory: data.visibleInDirectory,
        allowDirectBooking: data.allowDirectBooking,
        showOnlineStatus: data.showOnlineStatus,
      },
    };

    const success = await saveProfile(profileData);
    
    if (success) {
      localStorage.removeItem("vairify_profile_draft");
      toast.success("Profile created successfully!");
      // After profile creation with username, show premium options
      navigate("/pricing");
    }
  };

  const saveDraft = () => {
    const formData = form.getValues();
    localStorage.setItem("vairify_profile_draft", JSON.stringify(formData));
    // Show toast notification
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Info";
      case 2:
        return "Physical & Services";
      case 3:
        return "Payment Setup";
      case 4:
        return "Settings & Review";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of 4: {getStepTitle()}
              </span>
              <span className="text-primary font-medium">{completionPercentage}% Complete</span>
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                      step === currentStep
                        ? "bg-primary text-primary-foreground"
                        : step < currentStep
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step < currentStep ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span
                    className={`text-sm hidden sm:inline ${
                      step === currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step === 1 ? "Basic" : step === 2 ? "Services" : "Review"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Create Your Professional Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Only username is required—everything else is optional and helps you get discovered.
            </p>
            {userTier && <TierBadge tier={userTier} size="lg" />}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step Content */}
              {currentStep === 1 && <BasicInfoStep form={form} />}
              {currentStep === 2 && <PhysicalServicesStep form={form} />}
              {currentStep === 3 && <PaymentSetupStep />}
              {currentStep === 4 && (
                <SettingsReviewStep form={form} completionPercentage={completionPercentage} />
              )}
            </form>
          </Form>
        </div>
      </div>

      {/* Sticky Footer with Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border p-4 md:p-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Left side - Back button or info */}
            <div className="w-full sm:w-auto">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Edit anytime in Settings
                </p>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                className="flex-1 sm:flex-none"
                disabled={saving}
              >
                Save Draft
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || saving}
                  className="flex-1 sm:flex-none min-w-[150px]"
                >
                  {currentStep === 3 ? "Skip & Continue" : "Next Step"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  className="flex-1 sm:flex-none min-w-[200px]"
                  disabled={!form.getValues("username") || saving}
                >
                  {saving ? "Saving..." : "Complete Profile"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
