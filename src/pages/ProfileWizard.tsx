import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { LanguageStep } from "@/components/profile/LanguageStep";
import { PersonalInfoStep } from "@/components/profile/PersonalInfoStep";
import { AppearanceStep } from "@/components/profile/AppearanceStep";
import { ServicesStep } from "@/components/profile/ServicesStep";
import { PricingStep } from "@/components/profile/PricingStep";
import { ClientSettingsStep } from "@/components/profile/ClientSettingsStep";
import { useProviderProfile, type ProviderProfile } from "@/hooks/useProviderProfile";
import { toast } from "sonner";
import { TierBadge } from "@/components/profile/TierBadge";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  // Step 1: Language
  languages: z.array(z.string()).default([]),
  
  // Step 2: Personal Info (only username required for providers)
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  
  // Step 3: Appearance (all optional, provider only)
  height: z.string().optional(),
  weight: z.string().optional(),
  hairColor: z.string().optional(),
  hairLength: z.string().optional(),
  eyeColor: z.string().optional(),
  bodyType: z.string().optional(),
  ethnicity: z.string().optional(),
  ageRange: z.string().optional(),
  
  // Step 4: Services (provider only)
  selectedServices: z.array(z.string()).default([]), // service_option IDs
  
  // Step 5: Pricing (provider only) OR Settings (client)
  servicePricing: z.record(z.object({
    priceType: z.enum(['included', 'extra']),
    customPrice: z.number().optional(),
  })).default({}),
  
  // Client Settings (client only)
  profileVisible: z.boolean().default(true),
  showOnlineStatus: z.boolean().default(false),
  allowMessages: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  profileLinks: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).default([]),
});

type FormValues = z.infer<typeof formSchema>;

type UserRole = 'provider' | 'client' | null;

export default function ProfileWizard() {
  const navigate = useNavigate();
  const { profile, loading, saving, saveProfile } = useProviderProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userTier, setUserTier] = useState<'founding_council' | 'first_movers' | 'early_access' | 'standard' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languages: [],
      username: "",
      bio: "",
      avatarUrl: "",
      height: "",
      weight: "",
      hairColor: "",
      hairLength: "",
      eyeColor: "",
      bodyType: "",
      ethnicity: "",
      ageRange: "",
      selectedServices: [],
      servicePricing: {},
      profileVisible: true,
      showOnlineStatus: false,
      allowMessages: true,
      emailNotifications: true,
      pushNotifications: true,
      profileLinks: [],
    },
  });

  // Detect user role
  useEffect(() => {
    const detectRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRoleLoading(false);
          return;
        }

        // Check sessionStorage first (set during onboarding)
        const storedRole = sessionStorage.getItem('vairify_role') as UserRole;
        if (storedRole === 'provider' || storedRole === 'client') {
          setUserRole(storedRole);
          setRoleLoading(false);
          return;
        }

        // Check if user has provider profile
        const { data: providerProfile } = await supabase
          .from('provider_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (providerProfile) {
          setUserRole('provider');
          sessionStorage.setItem('vairify_role', 'provider');
        } else {
          // Check if user has regular profile (could be client)
          const { data: regularProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          // Default to client if no provider profile exists
          setUserRole('client');
          sessionStorage.setItem('vairify_role', 'client');
        }
      } catch (error) {
        console.error("Error detecting role:", error);
        // Default to client on error
        setUserRole('client');
      } finally {
        setRoleLoading(false);
      }
    };

    detectRole();
  }, []);

  // Check user tier
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

  // Load existing profile data
  useEffect(() => {
    if (userRole === 'provider' && profile && !loading) {
      // Load provider profile data
      form.reset({
        username: profile.username || "",
        avatarUrl: profile.avatar_url || "",
        height: profile.height || "",
        weight: profile.weight || "",
        hairColor: profile.hair_color || "",
        hairLength: profile.hair_length || "",
        eyeColor: profile.eye_color || "",
        bodyType: profile.body_type || "",
        ethnicity: profile.ethnicity || "",
        ageRange: profile.age_range || "",
        selectedServices: profile.services_offered || [],
        languages: [], // Load from separate table if exists
        servicePricing: {}, // Load from provider_service_pricing table
      });
    } else if (userRole === 'client' && !loading) {
      // Load client profile data
      const loadClientProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (clientProfile) {
          form.reset({
            bio: (clientProfile as any).bio || "",
            avatarUrl: clientProfile.avatar_url || "",
            profileVisible: true, // Default, load from privacy_settings if exists
            showOnlineStatus: false,
            allowMessages: true,
            emailNotifications: true,
            pushNotifications: true,
            profileLinks: (clientProfile as any).profile_links || [],
            languages: [],
          });
        }
      };

      loadClientProfile();
    }
  }, [profile, loading, form, userRole]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const formData = form.getValues();
      localStorage.setItem("vairify_profile_wizard_draft", JSON.stringify({
        formData,
        currentStep,
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [form, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("vairify_profile_wizard_draft");
    if (draft) {
      try {
        const { formData, currentStep: savedStep } = JSON.parse(draft);
        form.reset(formData);
        setCurrentStep(savedStep || 1);
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, [form]);

  // Save current step progress
  const saveStepProgress = async (step: number) => {
    try {
      const formData = form.getValues();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only save if username exists (required for providers)
      if (userRole === 'provider' && step >= 2 && !formData.username) {
        return;
      }

      // Save to localStorage
      localStorage.setItem("vairify_profile_wizard_draft", JSON.stringify({
        formData,
        currentStep: step,
      }));

      // Save to database based on role
      if (userRole === 'provider' && formData.username) {
        await saveProfile({
          username: formData.username,
          avatar_url: formData.avatarUrl,
          height: formData.height,
          weight: formData.weight,
          hair_color: formData.hairColor,
          hair_length: formData.hairLength,
          eye_color: formData.eyeColor,
          body_type: formData.bodyType,
          ethnicity: formData.ethnicity,
          age_range: formData.ageRange,
          services_offered: formData.selectedServices,
        });
      } else if (userRole === 'client') {
        // Save client profile (no username required)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              avatar_url: formData.avatarUrl,
              bio: formData.bio,
              profile_links: formData.profileLinks || [],
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            });
        }
      }
    } catch (error) {
      console.error("Error saving step progress:", error);
    }
  };

  // Get total steps based on role
  const getTotalSteps = (): number => {
    if (userRole === 'client') {
      return 3; // Language, Personal Info, Settings
    }
    return 5; // Language, Personal Info, Appearance, Services, Pricing
  };

  const TOTAL_STEPS = getTotalSteps();

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Validate current step - username required for providers only
      if (userRole === 'provider' && currentStep === 2 && !form.getValues("username")) {
        toast.error("Username is required to continue");
        return;
      }

      // Save progress before moving to next step
      await saveStepProgress(currentStep);

      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const canProceed = () => {
    // Step 2 requires username for providers only
    if (currentStep === 2 && userRole === 'provider') {
      return !!form.getValues("username") && form.getValues("username").length >= 3;
    }
    // All other steps can proceed without validation
    return true;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save your profile");
        return;
      }

      if (userRole === 'provider') {
        // Provider-specific validation
        if (!data.username || data.username.trim().length < 3) {
          toast.error("Username is required and must be at least 3 characters");
          setCurrentStep(2);
          return;
        }

        // Save provider profile
        const profileData: Partial<ProviderProfile> = {
          username: data.username.trim(),
          avatar_url: data.avatarUrl,
          height: data.height,
          weight: data.weight,
          hair_color: data.hairColor,
          hair_length: data.hairLength,
          eye_color: data.eyeColor,
          body_type: data.bodyType,
          ethnicity: data.ethnicity,
          age_range: data.ageRange,
          services_offered: data.selectedServices,
        };

        const success = await saveProfile(profileData);

        if (success) {
          // Save service pricing
          if (Object.keys(data.servicePricing).length > 0) {
            const pricingEntries = Object.entries(data.servicePricing).map(([serviceOptionId, pricing]) => ({
              user_id: user.id,
              service_option_id: serviceOptionId,
              price_type: pricing.priceType,
              custom_price: pricing.customPrice || null,
            }));

            // Upsert pricing entries
            for (const entry of pricingEntries) {
              await supabase
                .from('provider_service_pricing')
                .upsert([entry], {
                  onConflict: 'user_id,service_option_id',
                });
            }
          }

          localStorage.removeItem("vairify_profile_wizard_draft");
          toast.success("Profile created successfully!");
          navigate("/feed");
        }
      } else {
        // Client profile save
        // Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            avatar_url: data.avatarUrl,
            bio: data.bio,
            profile_links: data.profileLinks || [],
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (profileError) throw profileError;

        // Save privacy settings if privacy_settings table exists
        const { error: privacyError } = await supabase
          .from('privacy_settings')
          .upsert({
            user_id: user.id,
            profile_visibility: data.profileVisible ? 'public' : 'private',
            online_status_visible: data.showOnlineStatus,
            show_in_search: data.profileVisible,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (privacyError && privacyError.code !== 'PGRST116') {
          // PGRST116 = table doesn't exist, ignore
          console.error("Error saving privacy settings:", privacyError);
        }

        // Save notification settings if user_settings table exists
        const { error: notificationError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            email_notifications: data.emailNotifications,
            push_notifications: data.pushNotifications,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (notificationError && notificationError.code !== 'PGRST116') {
          console.error("Error saving notification settings:", notificationError);
        }

        localStorage.removeItem("vairify_profile_wizard_draft");
        toast.success("Profile created successfully!");
        navigate("/feed");
      }
    } catch (error: any) {
      console.error("Error submitting profile:", error);
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const getStepTitle = () => {
    if (userRole === 'client') {
      switch (currentStep) {
        case 1:
          return "Language";
        case 2:
          return "Personal Info";
        case 3:
          return "Settings";
        default:
          return "";
      }
    } else {
      switch (currentStep) {
        case 1:
          return "Language";
        case 2:
          return "Personal Info";
        case 3:
          return "Appearance";
        case 4:
          return "Services";
        case 5:
          return "Pricing";
        default:
          return "";
      }
    }
  };

  // Get total steps based on role
  /*
  const getTotalSteps = (): number => {
    if (userRole === 'client') {
      return 3; // Language, Personal Info, Settings
    }
    return 5; // Language, Personal Info, Appearance, Services, Pricing
  };
*/
  // Get step numbers for display based on role
  const getStepNumbers = (): number[] => {
    if (userRole === 'client') {
      return [1, 2, 3];
    }
    return [1, 2, 3, 4, 5];
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-foreground">Unable to Detect Role</h2>
          <p className="text-muted-foreground">
            Please select your role first from the onboarding flow.
          </p>
          <Button onClick={() => navigate("/onboarding/role")}>
            Go to Role Selection
          </Button>
        </div>
      </div>
    );
  }

  //const TOTAL_STEPS = getTotalSteps();
  const progress = (currentStep / TOTAL_STEPS) * 100;
  const stepNumbers = getStepNumbers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}: {getStepTitle()}
              </span>
              <span className="text-primary font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              {stepNumbers.map((step, index) => (
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
                  {index < stepNumbers.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${
                        step < currentStep ? "bg-success" : "bg-muted"
                      }`}
                    />
                  )}
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
              {userRole === 'provider' 
                ? 'Create Your Professional Profile'
                : 'Create Your Profile'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {userRole === 'provider'
                ? 'Only username is required—everything else is optional and helps you get discovered.'
                : 'Set up your profile to connect with providers safely.'}
            </p>
            {userRole === 'provider' && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Provider Account
                </Badge>
                {userTier && <TierBadge tier={userTier} size="lg" />}
              </div>
            )}
            {userRole === 'client' && (
              <Badge variant="secondary" className="bg-accent/20 text-accent">
                Client Account
              </Badge>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Step Content - Role-Based */}
              {currentStep === 1 && <LanguageStep form={form} />}
              {currentStep === 2 && <PersonalInfoStep form={form} userRole={userRole} />}
              
              {/* Provider-only steps */}
              {userRole === 'provider' && (
                <>
                  {currentStep === 3 && <AppearanceStep form={form} />}
                  {currentStep === 4 && <ServicesStep form={form} />}
                  {currentStep === 5 && <PricingStep form={form} />}
                </>
              )}
              
              {/* Client-only step */}
              {userRole === 'client' && currentStep === 3 && <ClientSettingsStep form={form} />}
            </form>
          </Form>
        </div>
      </div>

      {/* Sticky Footer with Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border p-4 md:p-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Left side - Back button */}
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
              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || saving}
                  className="flex-1 sm:flex-none min-w-[150px]"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  className="flex-1 sm:flex-none min-w-[200px]"
                  disabled={(userRole === 'provider' && !form.getValues("username")) || saving}
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

