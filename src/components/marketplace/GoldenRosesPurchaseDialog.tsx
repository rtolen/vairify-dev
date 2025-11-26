import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Check } from "lucide-react";

interface Bundle {
  id: string;
  bundle_name: string;
  price_usd: number;
  roses_amount: number;
  display_order: number;
}

interface GoldenRosesPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete?: () => void;
}

export function GoldenRosesPurchaseDialog({
  open,
  onOpenChange,
  onPurchaseComplete,
}: GoldenRosesPurchaseDialogProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    if (open) {
      loadBundles();
      loadBalance();
    }
  }, [open]);

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("golden_roses_bundles")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setBundles(data || []);
    } catch (error: any) {
      console.error("Error loading bundles:", error);
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("golden_roses_balance")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCurrentBalance(data?.balance || 0);
    } catch (error: any) {
      console.error("Error loading balance:", error);
    }
  };

  const handlePurchase = async (bundle: Bundle) => {
    try {
      setPurchasing(bundle.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // TODO: Integrate with Stripe for actual payment
      // For now, simulate successful purchase
      toast.info(`Payment processing for $${bundle.price_usd}...`);

      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update balance
      const { data: balanceData, error: balanceError } = await supabase
        .from("golden_roses_balance")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      const currentAmount = balanceData?.balance || 0;
      const newBalance = currentAmount + bundle.roses_amount;

      const { error: updateError } = await supabase
        .from("golden_roses_balance")
        .upsert({
          user_id: user.id,
          balance: newBalance,
          lifetime_earned: newBalance,
        });

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from("golden_roses_transactions")
        .insert({
          user_id: user.id,
          amount: bundle.roses_amount,
          transaction_type: "purchase",
          description: `Purchased ${bundle.bundle_name}`,
        });

      if (txError) throw txError;

      toast.success(`Successfully purchased ${bundle.roses_amount} Golden Roses! 🌹`);
      setCurrentBalance(newBalance);
      onPurchaseComplete?.();
    } catch (error: any) {
      console.error("Error purchasing bundle:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Purchase Golden Roses
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-yellow-500">{currentBalance} 🌹</p>
            </div>
          </Card>

          {/* Bundles */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {bundles.map((bundle) => (
                <Card
                  key={bundle.id}
                  className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{bundle.bundle_name}</h3>
                        {bundle.price_usd === 30 && (
                          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            Best Value
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-yellow-500">
                          {bundle.roses_amount}
                        </span>
                        <span className="text-lg text-muted-foreground">Golden Roses 🌹</span>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Boost your marketplace posts
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Premium directory placement
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Increase visibility & engagement
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-6">
                      <div className="text-right">
                        <p className="text-3xl font-bold">${bundle.price_usd}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(bundle.price_usd / bundle.roses_amount).toFixed(3)}/rose
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => handlePurchase(bundle)}
                        disabled={purchasing !== null}
                        className="min-w-[120px]"
                      >
                        {purchasing === bundle.id ? "Processing..." : "Purchase"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              💡 Golden Roses are used to boost your posts in the marketplace feed and improve your placement in the provider directory. Premium members receive automatic premium placement!
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
