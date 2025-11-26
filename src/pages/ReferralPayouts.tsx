import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export default function ReferralPayouts() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('referral_payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('payout_date', { ascending: false });

      setPayouts(data || []);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">PAYOUT HISTORY</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Next Payout */}
        <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5">
          <h2 className="font-bold text-lg mb-4">NEXT PAYOUT</h2>
          <div className="bg-background/50 rounded-lg p-4 mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <DollarSign className="w-6 h-6 text-success" />
              <span className="text-3xl font-bold text-success">$56.00</span>
            </div>
            <p className="text-sm font-semibold">November 15, 2025</p>
            <p className="text-xs text-muted-foreground">(8 days away)</p>
          </div>

          <div className="space-y-2 text-sm">
            <p>From 28 active referrals</p>
            <p>(12 Premium subscribers)</p>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-semibold mb-1">Payment Method:</p>
            <p className="text-sm">Bank •••• 1234</p>
            <Button variant="link" className="p-0 h-auto text-primary" size="sm">
              Update Method →
            </Button>
          </div>
        </Card>

        {/* Minimum Payout Info */}
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm">
            ⚠️ <span className="font-semibold">Minimum payout: $20</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Payouts process on the 15th of each month
          </p>
        </div>

        {/* Payment Method */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">PAYMENT METHOD</h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">Current:</p>
            <p className="font-semibold">Bank Transfer</p>
            <p className="text-sm">•••• 1234</p>
            <Button variant="outline" className="mt-3">
              Change Method
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-1">Available methods:</p>
            <ul className="space-y-1 ml-4">
              <li>• Bank Transfer (ACH)</li>
              <li>• PayPal</li>
              <li>• VairiPay Wallet</li>
            </ul>
          </div>
        </Card>

        {/* Past Payouts */}
        <div>
          <h3 className="font-bold text-lg mb-4">PAST PAYOUTS</h3>
          
          {payouts.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payout history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your first payout will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        {new Date(payout.payout_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="text-2xl font-bold text-success">
                        ${parseFloat(payout.amount).toFixed(2)}
                      </p>
                    </div>
                    <Badge 
                      variant={payout.status === 'completed' ? 'default' : 'secondary'}
                      className={payout.status === 'completed' ? 'bg-success' : ''}
                    >
                      {payout.status}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-1">
                      {payout.status === 'completed' && <CheckCircle className="w-4 h-4 text-success" />}
                      Paid: {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                    {payout.payment_reference && (
                      <p className="text-muted-foreground">
                        Reference: {payout.payment_reference}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Receipt</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Lifetime Summary */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-cyan-500/5">
          <h3 className="font-bold mb-4">LIFETIME SUMMARY</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Earned:</p>
              <p className="text-xl font-bold">$672.00</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Paid Out:</p>
              <p className="text-xl font-bold">$616.00</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pending:</p>
              <p className="text-xl font-bold text-success">$56.00</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Monthly:</p>
              <p className="text-xl font-bold">$61.09</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Member since: Dec 2024 (11 months)
          </p>
        </Card>
      </div>
    </div>
  );
}
