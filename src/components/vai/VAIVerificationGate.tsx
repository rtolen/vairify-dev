import { useEffect, useState } from "react";
import { Shield, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface VAIVerificationGateProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
  featureName: string;
  featureDescription: string;
}

export const VAIVerificationGate = ({
  isOpen,
  onClose,
  onVerified,
  featureName,
  featureDescription,
}: VAIVerificationGateProps) => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkVAIStatus();
    }
  }, [isOpen]);

  const checkVAIStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("vai_verifications")
        .select("vai_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setIsVerified(true);
        onVerified?.();
        onClose();
      }
    } catch (error) {
      console.error("Error checking V.A.I. status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    const redirectUrl = `${window.location.origin}/vai-callback`;
    const chainpassUrl = `https://platform.chainpass.com/verify?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = chainpassUrl;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>V.A.I. Verification Required</DialogTitle>
              <DialogDescription className="text-xs">
                Enhanced security for {featureName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {featureDescription} requires V.A.I. verification to ensure safety and security for all users.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Identity Protection</p>
                <p className="text-xs text-muted-foreground">
                  Your identity remains anonymous while being verified
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Quick Process</p>
                <p className="text-xs text-muted-foreground">
                  Verification takes just a few minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Full Access</p>
                <p className="text-xs text-muted-foreground">
                  Unlock all premium features after verification
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleStartVerification} className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Verify Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
