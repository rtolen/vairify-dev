import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function ReferralManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [stats, setStats] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [referralsData, earningsData, payoutsData] = await Promise.all([
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_earnings').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_payouts').select('*').order('payout_date', { ascending: false })
      ]);

      setReferrals(referralsData.data || []);
      setEarnings(earningsData.data || []);
      setPayouts(payoutsData.data || []);

      // Calculate stats
      const totalReferrals = referralsData.data?.length || 0;
      const premiumReferrals = referralsData.data?.filter(r => r.subscription_status === 'premium').length || 0;
      const totalEarnings = earningsData.data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const totalPayouts = payoutsData.data?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      setStats({
        totalReferrals,
        premiumReferrals,
        totalEarnings,
        totalPayouts
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Referral System Management</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats?.totalReferrals}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Premium Referrals</p>
                <p className="text-2xl font-bold">{stats?.premiumReferrals}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats?.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">${stats?.totalPayouts.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Data */}
        <Card className="p-6">
          <Tabs defaultValue="referrals">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
              <TabsTrigger value="earnings">Earnings ({earnings.length})</TabsTrigger>
              <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="space-y-4 mt-4">
              {referrals.map((referral) => (
                <Card key={referral.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Referral ID: {referral.id.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {referral.subscription_status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {referral.upgraded_to_premium_at && (
                      <p className="text-xs text-success">
                        Upgraded: {new Date(referral.upgraded_to_premium_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4 mt-4">
              {earnings.map((earning) => (
                <Card key={earning.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-success">
                        ${parseFloat(earning.amount.toString()).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Month: {earning.month_year}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4 mt-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-success">
                        ${parseFloat(payout.amount.toString()).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {payout.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Method: {payout.payment_method}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.payout_date).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
