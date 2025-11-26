import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AccountVerificationStep } from "../components/onboarding/AccountVerificationStep";
import { ProfileSetupStep } from "../components/onboarding/ProfileSetupStep";
import { DashboardIntroStep } from "../components/onboarding/DashboardIntroStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InfluencerOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const TOTAL_STEPS = 3;

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
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

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Update influencer profile with onboarding data
      await supabase
        .from('influencers')
        .update({
          // Update with formData
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      toast.success("Onboarding complete! Welcome to your dashboard.");
      navigate("/influencers/dashboard");
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error("Failed to complete onboarding");
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span className="text-primary font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
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
                  {step < 3 && (
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
          {currentStep === 1 && (
            <AccountVerificationStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 2 && (
            <ProfileSetupStep
              formData={formData}
              setFormData={setFormData}
            />
          )}
          {currentStep === 3 && (
            <DashboardIntroStep onComplete={handleComplete} />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border p-4 md:p-6">
        <div className="container mx-auto max-w-3xl">
          <div className="flex gap-3 items-center justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            ) : (
              <div />
            )}
            {currentStep < TOTAL_STEPS ? (
              <Button onClick={nextStep} className="ml-auto">
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="ml-auto">
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


