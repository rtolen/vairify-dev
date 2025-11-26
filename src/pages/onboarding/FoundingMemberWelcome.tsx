import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Zap, Gift } from "lucide-react";
import vairifyLogo from "@/assets/vairify-logo.png";
import { supabase } from "@/integrations/supabase/client";

type CouponTier = "FC" | "FM" | "EA";

interface TierInfo {
  name: string;
  duration: string;
  perks: string[];
  icon: React.ReactNode;
  gradient: string;
}

const tierData: Record<CouponTier, TierInfo> = {
  FC: {
    name: "Founding Council",
    duration: "Lifetime Premium",
    perks: [
      "Free Premium Forever",
      "100% Free VAI Verifications",
      "Early Access: December 10th",
      "Governance & Voting Rights",
      "Founding Council Badge",
      "Vote on Premium Features (Dec 27)",
      "Ambassador Status"
    ],
    icon: <Crown className="w-12 h-12" />,
    gradient: "from-yellow-400 via-yellow-500 to-amber-600",
  },
  FM: {
    name: "First Movers",
    duration: "1 Year Free",
    perks: [
      "Free Premium for 1 Year",
      "5% Discount on All VAI",
      "Early Access: December 15th",
      "First Mover Badge",
      "Vote on Premium Features (Dec 27)",
      "Ambassador Status"
    ],
    icon: <Zap className="w-12 h-12" />,
    gradient: "from-purple-400 via-purple-500 to-indigo-600",
  },
  EA: {
    name: "Early Access",
    duration: "6 Months Free + 20% Forever",
    perks: [
      "Free Premium for 6 Months",
      "20% Off Premium Forever",
      "Early Access: December 20th",
      "Early Access Badge",
      "Vote on Premium Features (Dec 27)",
      "Ambassador Status"
    ],
    icon: <Sparkles className="w-12 h-12" />,
    gradient: "from-blue-400 via-blue-500 to-cyan-600",
  },
};

const FoundingMemberWelcome = () => {
  const navigate = useNavigate();
  const [tier, setTier] = useState<CouponTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFoundingMember = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        // Get coupon from session storage (set during registration)
        const stored = sessionStorage.getItem('vairify_user');
        if (!stored) {
          // No coupon found, redirect to regular pricing
          navigate("/pricing");
          return;
        }

        const data = JSON.parse(stored);
        const couponCode = data.referralVAI;

        if (!couponCode) {
          navigate("/pricing");
          return;
        }

        // Extract tier from coupon code (FC, FM, or EA)
        const tierPrefix = couponCode.substring(0, 2).toUpperCase();
        if (tierPrefix === "FC" || tierPrefix === "FM" || tierPrefix === "EA") {
          setTier(tierPrefix as CouponTier);
        } else {
          // Invalid coupon format, go to regular pricing
          navigate("/pricing");
        }
      } catch (error) {
        console.error("Error checking founding member status:", error);
        navigate("/pricing");
      } finally {
        setLoading(false);
      }
    };

    checkFoundingMember();
  }, [navigate]);

  const handleContinue = () => {
    navigate("/profile-creation");
  };

  if (loading || !tier) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const tierInfo = tierData[tier];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[600px] relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 animate-fade-in">
          <img src={vairifyLogo} alt="VAIRIFY" className="w-20 h-20" />
        </div>

        {/* Hero Icon */}
        <div className="flex items-center justify-center mb-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${tierInfo.gradient} flex items-center justify-center shadow-2xl`}>
            <div className="text-white">
              {tierInfo.icon}
            </div>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          You're In The {tierInfo.name}!
        </h1>

        <p className="text-xl text-white/90 text-center mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          You're part of an exclusive group building the future of safety.
        </p>

        {/* Main Card */}
        <div className="bg-[rgba(30,58,138,0.4)] backdrop-blur-[12px] border-2 border-white/20 rounded-3xl p-8 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Your Status */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
              <Gift className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Your Premium Access</span>
            </div>
            <div className={`text-6xl font-bold bg-gradient-to-r ${tierInfo.gradient} bg-clip-text text-transparent mb-2`}>
              {tierInfo.duration}
            </div>
            <p className="text-white/80 text-lg">of Premium Features — Completely Free</p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 mb-8"></div>

          {/* Exclusive Perks */}
          <div className="space-y-4 mb-6">
            <h3 className="text-white text-xl font-semibold mb-4 text-center">Your Exclusive Perks:</h3>
            {tierInfo.perks.map((perk, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-white/5 rounded-xl p-4 animate-fade-in"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${tierInfo.gradient} flex items-center justify-center mt-0.5`}>
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <p className="text-white/90 leading-relaxed">{perk}</p>
              </div>
            ))}
          </div>

          {/* Special Message */}
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <p className="text-white text-center leading-relaxed">
              <span className="font-semibold">You believed in our mission early.</span> You're not just a user—you're a founding member of a movement to bring safety and accountability to one of the world's most dangerous industries.
            </p>
          </div>
        </div>

        {/* Safety Features Reminder */}
        <div className="bg-[rgba(30,58,138,0.3)] backdrop-blur-[10px] border border-white/10 rounded-2xl p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <p className="text-white/90 text-center text-sm leading-relaxed">
            <span className="font-semibold text-white">Remember:</span> All safety features (DateGuard, V.A.I.-CHECK, TruRevu, Emergency Button) are <span className="font-bold text-white">FREE FOREVER</span> for everyone. Your premium membership gives you convenience upgrades—but safety is our gift to the community.
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full h-16 bg-white text-primary text-lg font-bold rounded-xl shadow-xl hover:bg-white/90 hover:scale-[1.02] transition-all duration-200 animate-fade-in"
          style={{ animationDelay: '1s' }}
        >
          Continue to Build Your Profile
        </Button>

        <p className="text-white/60 text-sm text-center mt-6 animate-fade-in" style={{ animationDelay: '1.1s' }}>
          Let's set up your account and get you connected to the community
        </p>
      </div>
    </div>
  );
};

export default FoundingMemberWelcome;
