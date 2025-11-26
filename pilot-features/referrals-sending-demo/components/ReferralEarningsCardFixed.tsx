import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, Users, Mail, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ReferralEarningsCardFixed() {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      // Fetch earnings
      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', user.id);

      const earningReferrals = referrals?.filter(r => r.subscription_status === 'premium') || [];
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthEarnings = earnings?.filter(e => e.month_year === currentMonth).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const lifetimeEarnings = earnings?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;

      setReferralData({
        code: codeData,
        referrals: {
          earning: earningReferrals,
        },
        stats: {
          totalInvites: referrals?.length || 0,
          signedUp: referrals?.length || 0,
          premium: earningReferrals.length,
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralData?.code) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Referral Earnings
        </CardTitle>
        <CardDescription>
          Earn 10% lifetime commission on every Premium referral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-success">
              ${referralData.earnings.thisMonth.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lifetime</p>
            <p className="text-2xl font-bold">
              ${referralData.earnings.lifetime.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {referralData.stats.premium} Premium
            </span>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success">
            <TrendingUp className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={() => navigate('/referrals/invite/email')}
            variant="default"
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite via Email
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          <Button
            onClick={() => navigate('/referrals/invite/sms')}
            variant="outline"
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Invite via SMS
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
          <Button
            onClick={() => navigate('/referrals')}
            variant="ghost"
            className="w-full"
          >
            View All Referrals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


