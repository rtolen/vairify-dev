import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, Copy, BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  totalReferrals: number;
  premiumReferrals: number;
  activeReferrals: number;
  earningsThisMonth: number;
  earningsLifetime: number;
  tier: string;
  commissionRate: number;
}

export default function ReferralEarningsCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedEarnings, setAnimatedEarnings] = useState(0);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  // Animate earnings count-up
  useEffect(() => {
    if (stats && stats.earningsThisMonth > 0) {
      const duration = 1000;
      const steps = 30;
      const increment = stats.earningsThisMonth / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= stats.earningsThisMonth) {
          setAnimatedEarnings(stats.earningsThisMonth);
          clearInterval(timer);
        } else {
          setAnimatedEarnings(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [stats]);

  const fetchReferralStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get referral code and tier
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('tier, commission_rate')
        .eq('user_id', user.id)
        .single();

      // Get total and premium referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('subscription_status')
        .eq('referrer_id', user.id);

      const totalReferrals = referrals?.length || 0;
      const premiumReferrals = referrals?.filter(r => r.subscription_status === 'premium').length || 0;

      // Get this month's earnings
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('amount')
        .eq('referrer_id', user.id)
        .eq('month_year', monthYear);

      const earningsThisMonth = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Get lifetime earnings
      const { data: lifetimeEarnings } = await supabase
        .from('referral_earnings')
        .select('amount')
        .eq('referrer_id', user.id);

      const earningsLifetime = lifetimeEarnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalReferrals,
        premiumReferrals,
        activeReferrals: totalReferrals,
        earningsThisMonth,
        earningsLifetime,
        tier: codeData?.tier || 'earlyaccess',
        commissionRate: Number(codeData?.commission_rate) || 0
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (codeData?.referral_code) {
        const link = `${window.location.origin}?ref=${codeData.referral_code}`;
        await navigator.clipboard.writeText(link);
        toast.success("Referral link copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const getTierInfo = () => {
    switch (stats.tier) {
      case 'founding':
        return {
          badge: "Founding Council ⭐",
          rate: "10% for life",
          color: "text-yellow-500"
        };
      case 'firstmover':
        return {
          badge: "First Mover 🥈",
          rate: "5% for life",
          color: "text-gray-400"
        };
      default:
        return {
          badge: "Early Access",
          rate: "No commission",
          color: "text-blue-400"
        };
    }
  };

  const tierInfo = getTierInfo();

  // Variation 1: Setup Prompt (0 referrals)
  if (stats.totalReferrals === 0) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">💰 Earn Lifetime Commissions</h2>
        <Card className="bg-gradient-to-br from-cyan-600 to-blue-700 border-0 shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-6xl mb-2">🎁</div>
            <h3 className="text-2xl font-bold text-white">GET STARTED NOW!</h3>
            
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-white font-semibold text-lg mb-2">
                YOU EARN {tierInfo.rate.toUpperCase()}
              </p>
              <p className={`${tierInfo.color} font-bold text-sm`}>
                {tierInfo.badge}
              </p>
            </div>

            <p className="text-white/90 text-sm leading-relaxed">
              Invite friends. They get verified safety. You earn ${(stats.commissionRate * 20).toFixed(2)}/month per Premium subscriber. Forever.
            </p>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-white text-sm">
                <span className="font-bold">Example:</span> 10 friends = ${(stats.commissionRate * 200).toFixed(0)}/month = ${(stats.commissionRate * 2400).toFixed(0)}/year
              </p>
            </div>

            <Button 
              onClick={() => navigate("/referrals")}
              size="lg"
              className="w-full bg-white text-cyan-600 hover:bg-white/90 font-bold text-lg h-14 mt-4"
            >
              🚀 START INVITING
            </Button>

            <button 
              onClick={() => navigate("/referrals/help")}
              className="text-white/80 hover:text-white text-sm underline"
            >
              Learn How It Works →
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Variation 2: Active but low (< 5 Premium)
  if (stats.premiumReferrals < 5) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">💰 Earn Lifetime Commissions</h2>
        <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">YOU'RE EARNING!</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-yellow-400 text-2xl font-bold">
                  ${animatedEarnings.toFixed(2)}
                </p>
                <p className="text-white/70 text-xs">/month</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-yellow-400 text-2xl font-bold">
                  ${stats.earningsLifetime.toFixed(2)}
                </p>
                <p className="text-white/70 text-xs">lifetime</p>
              </div>
            </div>

            <p className="text-white text-sm">
              {stats.activeReferrals} Active • {stats.premiumReferrals} Premium
            </p>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-white text-sm">
                💡 Invite {5 - stats.premiumReferrals} more friends to reach ${(5 * stats.commissionRate * 20).toFixed(0)}/month!
              </p>
            </div>

            <Button 
              onClick={() => navigate("/referrals/invite-email")}
              className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              INVITE FRIENDS
            </Button>

            <button 
              onClick={() => navigate("/referrals")}
              className="text-white/80 hover:text-white text-sm underline w-full"
            >
              📊 Full Dashboard →
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Variation 3: Power User (10+ Premium)
  if (stats.premiumReferrals >= 10) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">💰 Referral Earnings</h2>
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-yellow-400 animate-pulse" />
              <h3 className="text-xl font-bold text-white">TOP EARNER!</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-yellow-400 text-3xl font-bold">
                  ${animatedEarnings.toFixed(2)}
                </p>
                <p className="text-white/70 text-xs">/month</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-yellow-400 text-3xl font-bold">
                  ${stats.earningsLifetime.toFixed(2)}
                </p>
                <p className="text-white/70 text-xs">lifetime</p>
              </div>
            </div>

            <div className="text-white text-sm space-y-1">
              <p>{stats.activeReferrals} Active • {stats.premiumReferrals} Premium</p>
              <p className="text-yellow-400">🏆 {tierInfo.badge}</p>
            </div>

            <Button 
              onClick={() => navigate("/referrals")}
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold h-12"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              FULL DASHBOARD
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => navigate("/referrals/invite-email")}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Mail className="w-4 h-4 mr-1" />
                Invite
              </Button>
              <Button 
                onClick={() => navigate("/referrals/invite-sms")}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Variation 4: Compact (5-9 Premium)
  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4">💰 Referral Earnings</h2>
      <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white">
              <p className="text-2xl font-bold">${stats.earningsThisMonth.toFixed(2)}/mo</p>
              <p className="text-xs text-white/70">{stats.activeReferrals} active • {stats.premiumReferrals} premium</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={() => navigate("/referrals")}
              size="sm"
              className="bg-white text-cyan-600 hover:bg-white/90"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Stats
            </Button>
            <Button 
              onClick={() => navigate("/referrals/invite-email")}
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Mail className="w-4 h-4 mr-1" />
              Email
            </Button>
            <Button 
              onClick={handleCopyLink}
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
