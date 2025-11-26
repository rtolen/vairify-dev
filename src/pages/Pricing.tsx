import { useState, useEffect } from "react";
import { Check, Shield, Star, Crown, Lock, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TierBadge } from "@/components/profile/TierBadge";

export default function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [userTier, setUserTier] = useState<'founding_council' | 'first_movers' | 'early_access' | null>(null);
  const foundingMemberDiscount = 0.5; // 50% off

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);

        // Check if user has founding member tier
        const { data: referralCode } = await supabase
          .from('referral_codes')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        if (referralCode?.tier === 'founding_council') {
          setIsFoundingMember(true);
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const monthlyPrice = 24.99;
  const yearlyPrice = 249;
  
  const finalMonthlyPrice = isFoundingMember 
    ? monthlyPrice * (1 - foundingMemberDiscount) * (1 - appliedDiscount)
    : monthlyPrice * (1 - appliedDiscount);
    
  const finalYearlyPrice = isFoundingMember 
    ? yearlyPrice * (1 - foundingMemberDiscount) * (1 - appliedDiscount)
    : yearlyPrice * (1 - appliedDiscount);

  const handleApplyCoupon = async () => {
    const code = couponCode.toUpperCase();
    
    // Check for tier-based coupon codes (FC, FM, EA)
    if (code.startsWith('FC')) {
      // Founding Council - Free premium forever, free VAI, early access Dec 10
      try {
        if (!userId) return;

        const { error } = await supabase
          .from('referral_codes')
          .upsert({
            user_id: userId,
            referral_code: code,
            tier: 'founding_council',
            commission_rate: 0.10,
            registered_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        // Update profile subscription
        await supabase
          .from('profiles')
          .update({ subscription_status: 'premium' })
          .eq('id', userId);

        setIsFoundingMember(true);
        setUserTier('founding_council');
        toast({
          title: "Founding Council Activated! 🏛️",
          description: "Lifetime Premium + Free VAI + Governance Rights. Complete VAI in 24h!",
        });
        setShowCoupon(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not apply coupon code",
          variant: "destructive"
        });
      }
    } else if (code.startsWith('FM')) {
      // First Movers - Free premium for 1 year, 5% off VAI, early access Dec 15
      try {
        if (!userId) return;

        const { error } = await supabase
          .from('referral_codes')
          .upsert({
            user_id: userId,
            referral_code: code,
            tier: 'first_movers',
            commission_rate: 0.07,
            registered_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        // Update profile subscription
        await supabase
          .from('profiles')
          .update({ subscription_status: 'premium' })
          .eq('id', userId);

        setUserTier('first_movers');
        toast({
          title: "First Mover Activated! 🚀",
          description: "1 Year Premium + 5% VAI Discount. Complete VAI in 24h!",
        });
        setShowCoupon(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not apply coupon code",
          variant: "destructive"
        });
      }
    } else if (code.startsWith('EA')) {
      // Early Access - Free premium for 6 months, 20% off premium forever
      try {
        if (!userId) return;

        const { error } = await supabase
          .from('referral_codes')
          .upsert({
            user_id: userId,
            referral_code: code,
            tier: 'early_access',
            commission_rate: 0.05,
            registered_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        // Update profile subscription
        await supabase
          .from('profiles')
          .update({ subscription_status: 'premium' })
          .eq('id', userId);

        setUserTier('early_access');
        toast({
          title: "Early Access Activated! ⚡",
          description: "6 Months Premium + 20% Forever Discount. Complete VAI in 24h!",
        });
        setShowCoupon(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not apply coupon code",
          variant: "destructive"
        });
      }
    } else if (code === "FOUNDING100" || code === "FIRSTMOVER") {
      try {
        if (!userId) return;

        const tier = code === "FOUNDING100" ? "founding_council" : "first_movers";
        
        const { error } = await supabase
          .from('referral_codes')
          .upsert({
            user_id: userId,
            referral_code: `${userId.substring(0, 8).toUpperCase()}`,
            tier: tier,
            commission_rate: tier === "founding_council" ? 0.10 : 0.07
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        setIsFoundingMember(tier === "founding_council");
        setUserTier(tier === "founding_council" ? 'founding_council' : 'first_movers');
        toast({
          title: "Coupon Applied!",
          description: `You are now a ${tier === "founding_council" ? "Founding Council" : "First Mover"} member`,
        });
        setShowCoupon(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not apply coupon code",
          variant: "destructive"
        });
      }
    } else if (code === "SAVE10") {
      setAppliedDiscount(0.1);
      toast({
        title: "Discount Applied!",
        description: "10% off your subscription",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "This coupon code is not valid",
        variant: "destructive"
      });
    }
  };

  const handleContinueFree = async () => {
    if (userId) {
      // Update profile to free tier
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Could not update subscription status",
          variant: "destructive"
        });
        return;
      }
    }

    navigate("/profile-creation");
  };

  const handleUpgradePremium = async () => {
    if (userId) {
      // Update profile to premium tier
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'premium' })
        .eq('id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Could not update subscription status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Premium Activated!",
        description: "Welcome to Vairify Premium",
      });
    }

    navigate("/profile-creation");
  };

  const freeFeatures = [
    "V.A.I.-CHECK (Identity verification)",
    "DateGuard (Unlimited sessions)",
    "TrueRevu (Verified reviews)",
    "Emergency Button (Always accessible)",
    "GPS Safety Tracking",
    "Law Enforcement Disclosure",
    "Mutual Consent Contracts"
  ];

  const premiumFeatures = [
    "Validate (Advanced verification)",
    "VairiPay (Integrated payments)",
    "Vairify Now (Instant booking)",
    "Smart Calendar (Scheduling)",
    "Revenue Sharing Tools",
    "Custom QR Codes",
    "Marketplace Access",
    "Priority Feed",
    "Enhanced Directory",
    "Unlimited Invitations",
    "Priority Support",
    "Profile Analytics"
  ];

  const trustPoints = [
    {
      icon: X,
      title: "Cancel Anytime",
      description: "No contracts"
    },
    {
      icon: Shield,
      title: "Safety Always Free",
      description: "Our promise"
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "256-bit encryption"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your Experience
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All safety features are free forever. Premium adds convenience.
          </p>
          {userTier && (
            <div className="flex justify-center">
              <TierBadge tier={userTier} size="lg" />
            </div>
          )}
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* FREE Column */}
          <Card className="border-2 border-success/50 relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-success" />
                <CardTitle className="text-2xl">Core Safety</CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">Forever</span>
              </div>
              <Badge className="w-fit bg-success text-success-foreground mt-2">
                <Check className="w-4 h-4 mr-1" />
                Active
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start space-y-2">
              <p className="text-sm text-success font-medium">
                ✓ Never pay for protection
              </p>
            </CardFooter>
          </Card>

          {/* PREMIUM Column */}
          <Card className="border-2 border-primary/50 relative overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl">Premium Convenience</CardTitle>
              </div>
              
              {/* Monthly/Yearly Toggle */}
              <div className="flex items-center justify-center gap-3 my-4 p-3 bg-muted/50 rounded-lg">
                <span className={isYearly ? "text-muted-foreground" : "font-medium text-foreground"}>
                  Monthly
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-primary"
                />
                <span className={isYearly ? "font-medium text-foreground" : "text-muted-foreground"}>
                  Yearly
                </span>
                {isYearly && (
                  <Badge variant="secondary" className="ml-2 bg-success text-success-foreground">
                    Save 17%
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  {isFoundingMember && (
                    <span className="text-xl text-muted-foreground line-through">
                      ${isYearly ? yearlyPrice : monthlyPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-foreground">
                    ${isYearly ? finalYearlyPrice.toFixed(2) : finalMonthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                </div>
                {isFoundingMember && (
                  <p className="text-sm text-primary font-medium">
                    🎉 Founding Council: 50% off forever
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="pt-4">
                <button
                  onClick={() => setShowCoupon(!showCoupon)}
                  className="text-base font-semibold text-primary dark:text-white hover:underline"
                >
                  Have a coupon code?
                </button>
                {showCoupon && (
                  <div className="flex gap-2 mt-2 animate-fade-in">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 text-base"
                    />
                    <Button onClick={handleApplyCoupon} size="sm" variant="secondary">
                      Apply
                    </Button>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <p className="text-base font-semibold text-success mt-2">
                    ✓ {appliedDiscount * 100}% discount applied!
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleUpgradePremium}>
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Tier Benefits Announcement */}
        {userTier && (
          <Card className="max-w-4xl mx-auto mt-8 border-2 border-primary bg-gradient-to-r from-primary/10 to-accent/10 animate-fade-in">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3">
                  {userTier === 'founding_council' && <Crown className="w-16 h-16 text-amber-500" />}
                  {userTier === 'first_movers' && <Star className="w-16 h-16 text-purple-500" />}
                  {userTier === 'early_access' && <Badge className="w-16 h-16 text-blue-500" />}
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {userTier === 'founding_council' && '🔥 Founding Council Member'}
                    {userTier === 'first_movers' && '⚡ First Movers Member'}
                    {userTier === 'early_access' && '🚀 Early Access Member'}
                  </h2>
                  <p className="text-lg text-muted-foreground">Your exclusive lifetime benefits</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Vairify Premium</h3>
                    <p className="text-2xl font-bold text-success mb-1">
                      {userTier === 'founding_council' && 'FREE Forever'}
                      {userTier === 'first_movers' && 'FREE for 1 Year'}
                      {userTier === 'early_access' && 'FREE for 6 Months'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userTier === 'founding_council' && 'Lifetime access to all premium features'}
                      {userTier === 'first_movers' && 'Full premium access for 12 months'}
                      {userTier === 'early_access' && 'Full premium access for 6 months'}
                    </p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <h3 className="font-bold text-lg mb-2 text-foreground">ChainPass V.A.I.</h3>
                    <p className="text-2xl font-bold text-primary mb-1">
                      {userTier === 'founding_council' && '100% OFF'}
                      {userTier === 'first_movers' && '50% OFF'}
                      {userTier === 'early_access' && '20% OFF'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userTier === 'founding_council' && 'Completely FREE verification'}
                      {userTier === 'first_movers' && 'Pay only $49.99 instead of $99.99'}
                      {userTier === 'early_access' && 'Pay only $79.99 instead of $99.99'}
                    </p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Permanent Status Badge</h3>
                    <div className="flex items-center gap-2">
                      {userTier === 'founding_council' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-foreground">Founding Council</span>
                        </>
                      )}
                      {userTier === 'first_movers' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-foreground">First Movers</span>
                        </>
                      )}
                      {userTier === 'early_access' && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Badge className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-foreground">Early Access</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Displayed on your profile forever</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <h3 className="font-bold text-lg mb-2 text-foreground">Additional Perks</h3>
                    <ul className="space-y-1 text-sm text-foreground">
                      {userTier === 'founding_council' && (
                        <>
                          <li>✓ Exclusive CEO community calls</li>
                          <li>✓ Direct input on new features</li>
                          <li>✓ Legal Fund Access (after Dec 31)</li>
                        </>
                      )}
                      {userTier === 'first_movers' && (
                        <>
                          <li>✓ CEO community calls</li>
                          <li>✓ Feature input opportunities</li>
                          <li>✓ Legal Fund Access (after Dec 31)</li>
                        </>
                      )}
                      {userTier === 'early_access' && (
                        <>
                          <li>✓ CEO community calls</li>
                          <li>✓ Legal Fund Access (after Dec 31)</li>
                          <li>✓ Priority support</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="bg-success/10 border border-success rounded-lg p-4">
                  <p className="text-success font-semibold text-lg">
                    🎉 These benefits are locked in for life!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your tier and perks will never change, no matter how our pricing evolves
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trust Section */}
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {trustPoints.map((point, index) => (
              <div key={index} className="text-center space-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <point.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                What happens if I don't upgrade?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely nothing changes! All core safety features remain completely free forever. 
                You'll still have full access to V.A.I.-CHECK, DateGuard (5 sessions/month), TrueRevu, 
                Emergency Button, GPS tracking, and all other safety features. Premium simply adds 
                convenience features like unlimited DateGuard sessions, calendar integration, and marketplace access.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                Can I upgrade later?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can upgrade to Premium at any time. Your Founding Council discount will 
                always be available to you as one of our first 100 members. Simply visit your 
                account settings whenever you're ready to unlock Premium convenience features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                What's the difference between free and premium?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Free gives you all safety features—everything you need to stay protected. Premium 
                adds convenience features like VairiPay for integrated payments, Vairify Now for 
                instant booking, Smart Calendar for scheduling, unlimited DateGuard sessions, 
                priority support, and access to our professional marketplace and directory features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                Do founding members keep the discount forever?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Your 50% Founding Council discount is locked in for life. As long as you 
                maintain your subscription, you'll always pay half of what new members pay. This 
                is our way of saying thank you for being part of our founding community.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleContinueFree}
            className="min-w-[200px]"
          >
            Continue with Free
          </Button>
          <Button
            size="lg"
            onClick={handleUpgradePremium}
            className="min-w-[200px] bg-primary hover:bg-primary/90"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
