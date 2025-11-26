import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function MembershipSettings() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState({
    status: "free",
    tier: "earlyaccess"
  });

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single();

      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      setSubscription({
        status: profile?.subscription_status || "free",
        tier: referralCode?.tier || "earlyaccess"
      });
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const getTierInfo = () => {
    switch (subscription.tier) {
      case 'founding':
        return {
          name: "Founding Council",
          icon: Crown,
          color: "text-yellow-500",
          badgeColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          benefits: [
            "10% lifetime referral commission",
            "Founding member badge",
            "Priority support",
            "Early access to all features",
            "Exclusive community access"
          ]
        };
      case 'firstmover':
        return {
          name: "First Mover",
          icon: Zap,
          color: "text-blue-500",
          badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          benefits: [
            "5% lifetime referral commission",
            "First mover badge",
            "Early access to features",
            "Priority support"
          ]
        };
      default:
        return {
          name: "Early Access",
          icon: Star,
          color: "text-gray-500",
          badgeColor: "bg-gray-500/10 text-gray-500 border-gray-500/20",
          benefits: [
            "Free platform access",
            "V.A.I. verification",
            "DateGuard features",
            "TrueRevu reviews"
          ]
        };
    }
  };

  const tierInfo = getTierInfo();
  const Icon = tierInfo.icon;
  const isPremium = subscription.status === 'premium';

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Membership</CardTitle>
          <CardDescription>
            Your current plan and benefits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${tierInfo.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{tierInfo.name}</h3>
                <Badge className={tierInfo.badgeColor} variant="outline">
                  {isPremium ? "Premium" : "Free"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-foreground">Benefits:</p>
            {tierInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-success" />
                {benefit}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade to Premium */}
      {!isPremium && (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription>
              Unlock all features and support the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Premium Monthly</span>
                <span className="text-2xl font-bold">$20/mo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cancel anytime. No hidden fees.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Premium includes:</p>
              <div className="space-y-2">
                {[
                  "Unlimited VAI-CHECK sessions",
                  "Priority DateGuard alerts",
                  "Advanced profile visibility",
                  "Featured in search results",
                  "24/7 priority support",
                  "Custom profile badge"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" size="lg">
              Upgrade to Premium - $20/mo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Billing & Payments</CardTitle>
            <CardDescription>
              Manage your subscription and view payment history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Next billing date</p>
                <p className="text-sm text-muted-foreground">December 15, 2025</p>
              </div>
              <p className="text-xl font-bold">$20.00</p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Influencer/Affiliate Program */}
      <Card className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Become an Influencer or Affiliate
          </CardTitle>
          <CardDescription>
            Earn higher commissions and exclusive benefits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Join our network of influencers and affiliates to unlock enhanced earning potential, 
            special perks, and recognition in the Vairify community.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/apply/influencer")}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Apply Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate("/application/status")}
              variant="outline"
              className="flex-1"
            >
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border-cyan-500/20">
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>
            Earn commissions by inviting friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            As a {tierInfo.name} member, you earn {subscription.tier === 'founding' ? '10%' : subscription.tier === 'firstmover' ? '5%' : '0%'} commission on all referrals.
          </p>
          <Button 
            onClick={() => navigate("/referrals")}
            className="w-full"
            variant="outline"
          >
            View Referral Dashboard →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
