import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Copy, Share2, Mail, MessageSquare, TrendingUp, DollarSign, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Referrals() {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("earning");

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch referral code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      // Fetch invitations
      const { data: invitations } = await supabase
        .from('referral_invitations')
        .select('*')
        .eq('referrer_id', user.id);

      // Fetch earnings
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', user.id);

      const earningReferrals = referrals?.filter(r => r.subscription_status === 'premium') || [];
      const freeReferrals = referrals?.filter(r => r.subscription_status === 'free') || [];
      const pendingInvitations = invitations?.filter(i => i.status === 'pending') || [];

      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthEarnings = earnings?.filter(e => e.month_year === currentMonth).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const lifetimeEarnings = earnings?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;

      setReferralData({
        code: codeData,
        referrals: {
          earning: earningReferrals,
          free: freeReferrals,
          pending: pendingInvitations
        },
        stats: {
          totalInvites: (referrals?.length || 0) + (pendingInvitations?.length || 0),
          signedUp: referrals?.length || 0,
          premium: earningReferrals.length,
          active: earningReferrals.length
        },
        earnings: {
          thisMonth: thisMonthEarnings,
          lifetime: lifetimeEarnings
        }
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://vairify.com/join/${referralData?.code?.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const shareReferral = async () => {
    const link = `https://vairify.com/join/${referralData?.code?.referral_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Vairify',
          text: 'Join the safest platform for adult services',
          url: link
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading referrals...</p>
        </div>
      </div>
    );
  }

  const tier = referralData?.code?.tier || 'standard';
  const tierName = tier === 'founding_council' ? 'Founding Council' : tier === 'first_movers' ? 'First Movers' : 'Member';
  const commissionRate = referralData?.code?.commission_rate || 0.05;
  const monthlyEarningPerReferral = 20 * commissionRate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">REFERRALS & EARNINGS</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/referral-leaderboard')} variant="ghost" size="icon">
              <TrendingUp className="w-5 h-5" />
            </Button>
            <button onClick={() => navigate('/referrals/help')} className="p-2 hover:bg-accent rounded-full">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Status Badge */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold">YOUR STATUS: {tierName}</span>
                {tier === 'founding_council' && <span className="text-xl">⭐</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Commission Rate: {(commissionRate * 100).toFixed(0)}% for life
              </p>
            </div>
          </div>
        </Card>

        {/* Earnings Overview */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-success" />
            <h2 className="text-lg font-bold">EARNINGS OVERVIEW</h2>
          </div>

          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">THIS MONTH</p>
            <p className="text-3xl font-bold text-success">${referralData?.earnings.thisMonth.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              From {referralData?.stats.active} active referrals
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">LIFETIME</p>
              <p className="text-xl font-bold">${referralData?.earnings.lifetime.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">NEXT PAYOUT</p>
              <p className="text-xl font-bold">${referralData?.earnings.thisMonth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Nov 15, 2025</p>
            </div>
          </div>

          <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/referrals/payouts')}>
            View Payout History →
          </Button>
        </Card>

        {/* Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">YOUR STATS</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{referralData?.stats.totalInvites}</p>
              <p className="text-sm text-muted-foreground">Total Invites</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{referralData?.stats.signedUp}</p>
              <p className="text-sm text-muted-foreground">
                Signed Up ({referralData?.stats.totalInvites > 0 ? Math.round((referralData.stats.signedUp / referralData.stats.totalInvites) * 100) : 0}% conv)
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{referralData?.stats.premium}</p>
              <p className="text-sm text-muted-foreground">
                Went Premium ({referralData?.stats.signedUp > 0 ? Math.round((referralData.stats.premium / referralData.stats.signedUp) * 100) : 0}%)
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{referralData?.stats.active}</p>
              <p className="text-sm text-muted-foreground">Currently Active</p>
            </div>
          </div>
        </Card>

        {/* Referral Code */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">YOUR REFERRAL CODE</h2>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">V.A.I.:</p>
            <p className="text-2xl font-bold mb-2">{referralData?.code?.referral_code}</p>
            <p className="text-sm text-primary break-all">
              vairify.com/join/{referralData?.code?.referral_code}
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1" onClick={copyReferralLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" className="flex-1" onClick={shareReferral}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80"
              onClick={() => navigate('/referrals/invite/email')}
            >
              <Mail className="w-5 h-5 mr-2" />
              INVITE VIA EMAIL
            </Button>
            <Button 
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500"
              onClick={() => navigate('/referrals/invite/sms')}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              INVITE VIA SMS
            </Button>
          </div>
        </Card>

        {/* Referrals List */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">YOUR REFERRALS ({referralData?.stats.active} Active)</h2>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="earning">
                Earning ({referralData?.referrals.earning.length})
              </TabsTrigger>
              <TabsTrigger value="free">
                Free ({referralData?.referrals.free.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({referralData?.referrals.pending.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earning" className="space-y-4">
              <div className="text-sm text-success font-semibold mb-2">
                ✅ EARNING ({referralData?.referrals.earning.length} Premium users)
              </div>
              {referralData?.referrals.earning.map((referral: any) => (
                <Card key={referral.id} className="p-4 border-l-4 border-l-success">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Referral User ✅</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success">
                      Premium Active
                    </Badge>
                  </div>

                  <div className="bg-success/5 rounded-lg p-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">YOUR EARNINGS:</p>
                    <div className="space-y-1 text-sm">
                      <p>• Per month: <span className="font-bold text-success">${monthlyEarningPerReferral.toFixed(2)}</span></p>
                      <p>• Total earned: <span className="font-bold">${(monthlyEarningPerReferral * 2).toFixed(2)}</span></p>
                      <p>• Active for: <span className="font-bold">2 months</span></p>
                    </div>
                  </div>
                </Card>
              ))}
              {referralData?.referrals.earning.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No earning referrals yet</p>
              )}
            </TabsContent>

            <TabsContent value="free" className="space-y-4">
              <div className="text-sm font-semibold mb-2 text-muted-foreground">
                💚 ACTIVE - FREE ({referralData?.referrals.free.length} users)
              </div>
              <p className="text-sm text-muted-foreground mb-4">Not earning yet - encourage them to upgrade!</p>
              
              {referralData?.referrals.free.map((referral: any) => (
                <Card key={referral.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Free User ✅</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Free</Badge>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 mt-3">
                    <p className="text-sm">
                      Potential: <span className="font-bold text-primary">${monthlyEarningPerReferral.toFixed(2)}/month</span>
                    </p>
                    <p className="text-xs text-muted-foreground">if they upgrade</p>
                  </div>
                </Card>
              ))}
              {referralData?.referrals.free.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No free referrals</p>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="text-sm font-semibold mb-2 text-muted-foreground">
                ⏳ PENDING INVITES ({referralData?.referrals.pending.length})
              </div>
              <p className="text-sm text-muted-foreground mb-4">Haven't signed up yet</p>
              
              {referralData?.referrals.pending.map((invitation: any) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {invitation.invite_method === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        <p className="font-medium">{invitation.invite_target}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Invited: {new Date(invitation.invited_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - new Date(invitation.invited_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      {invitation.invite_method === 'email' ? '📧 Resend Email' : '📱 Resend SMS'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      ❌ Cancel
                    </Button>
                  </div>
                </Card>
              ))}
              {referralData?.referrals.pending.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending invitations</p>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-cyan-500/5">
          <h3 className="font-bold mb-3">💡 TIPS TO INCREASE EARNINGS</h3>
          <ul className="space-y-2 text-sm">
            <li>• SMS invites convert 3x better!</li>
            <li>• Personal messages get 35% more upgrades</li>
            <li>• Follow up after 48 hours</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
