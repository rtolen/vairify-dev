import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
}

export const ProfileCompletionCard = () => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<ProfileStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Fetch provider profile if exists
      const { data: providerProfile } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch V.A.I. verification
      const { data: vaiVerification } = await supabase
        .from("vai_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch payment methods
      const { data: paymentMethods } = await supabase
        .from("user_payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      // Fetch guardians
      const { data: guardians } = await supabase
        .from("guardians")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      const profileSteps: ProfileStep[] = [
        {
          id: "basic_info",
          title: "Complete Basic Info",
          description: "Add your name and profile photo",
          completed: !!(profile?.full_name && profile?.avatar_url),
          route: "/settings",
        },
        {
          id: "vai_verification",
          title: "Get V.A.I. Verified",
          description: "Complete your identity verification",
          completed: !!vaiVerification,
          route: "/onboarding/success",
        },
        {
          id: "provider_profile",
          title: "Setup Provider Profile",
          description: "Add services and availability",
          completed: !!providerProfile && providerProfile.profile_completion_percentage >= 80,
          route: "/profile-creation",
        },
        {
          id: "payment_setup",
          title: "Add Payment Method",
          description: "Setup Vairipay for transactions",
          completed: !!paymentMethods && paymentMethods.length > 0,
          route: "/vairipay/setup",
        },
        {
          id: "dateguard_setup",
          title: "Setup DateGuard",
          description: "Add guardians for safety",
          completed: !!guardians && guardians.length > 0,
          route: "/dateguard/guardians",
        },
      ];

      setSteps(profileSteps);
    } catch (error) {
      console.error("Error checking profile completion:", error);
      toast.error("Failed to load profile completion status");
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isComplete = completedSteps === totalSteps;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return null; // Don't show if profile is complete
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Complete Your Profile
              <Badge variant="secondary">{completedSteps}/{totalSteps}</Badge>
            </CardTitle>
            <CardDescription>
              Unlock all features by completing your profile
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(completionPercentage)}% complete
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => navigate(step.route)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              {!step.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
