import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumUpgradeDialog = ({ open, onOpenChange }: PremiumUpgradeDialogProps) => {
  const features = [
    "Unlimited V.A.I.-CHECK verifications",
    "Priority DateGuard response",
    "Advanced TrueRevu analytics",
    "Premium badge on profile",
    "Early access to new features",
    "Priority support",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade to Premium</DialogTitle>
          <DialogDescription>
            Unlock all features and get the most out of Vairify
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">$29.99</div>
            <div className="text-muted-foreground">per month</div>
          </div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <Button className="w-full" size="lg">
            Upgrade Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
