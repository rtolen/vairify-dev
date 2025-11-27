import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Shield, Repeat, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import vairifyLogo from "@/assets/vairify-logo.png";
import { getChainPassUrl, getVairifyUrl } from "@/lib/environment";
import { useToast } from "@/hooks/use-toast";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [hasCoupon, setHasCoupon] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const sessionIdFromUrl = useMemo(() => searchParams.get("session_id"), [searchParams]);
  const chainPassBaseUrl = useMemo(() => (
    import.meta.env.VITE_CHAINPASS_URL ||
    import.meta.env.VIITE_CHAINPASS_URL ||
    getChainPassUrl()
  ), []);
  const getSignupSessionId = useCallback(() => {
    const storedSessionId = sessionStorage.getItem('signup_session_id');
    return storedSessionId || sessionIdFromUrl;
  }, [sessionIdFromUrl]);
  const currentPathWithSearch = useMemo(
    () => `${location.pathname}${location.search || ""}`,
    [location.pathname, location.search]
  );
  const buildChainPassUrl = useCallback((userId?: string | null) => {
    const params = new URLSearchParams();
    const sessionId = getSignupSessionId();
    const vairifyBaseUrl = getVairifyUrl();

    if (userId) {
      params.append('user_id', userId);
    }

    params.append('return_url', `${vairifyBaseUrl}/onboarding/vai-callback`);

    if (sessionId) {
      params.append('session_id', sessionId);
    }

    if (hasCoupon && userData?.referralVAI) {
      params.append('coupon', userData.referralVAI);
    }

    const paramString = params.toString();
    return `${chainPassBaseUrl}/?${paramString}`;
  }, [chainPassBaseUrl, getSignupSessionId, hasCoupon, userData]);

  const displayChainPassUrl = useMemo(() => buildChainPassUrl(authUserId), [buildChainPassUrl, authUserId]);

  useEffect(() => {
    const checkAuth = async () => {
      const stored = sessionStorage.getItem('vairify_user');
      console.log('📦 Session storage data:', stored);
      
      if (!stored) {
        console.log('⚠️ No stored user data, redirecting to welcome');
        navigate("/onboarding/welcome");
        return;
      }
      
      const data = JSON.parse(stored);
      setUserData(data);
      setHasCoupon(!!data.referralVAI);

      if (sessionIdFromUrl && !sessionStorage.getItem('signup_session_id')) {
        sessionStorage.setItem('signup_session_id', sessionIdFromUrl);
      }
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUserId(user?.id ?? null);
      console.log('✅ Success page loaded. User authenticated:', !!user, 'User ID:', user?.id);
    };
    
    checkAuth();
  }, [navigate, sessionIdFromUrl]);

  const redirectToLogin = () => {
    toast({
      title: "Please sign in again",
      description: "Log back in to continue your V.A.I. verification."
    });
    navigate(`/login?redirect=${encodeURIComponent(currentPathWithSearch)}`);
  };

  const handleGetVAI = () => {
    if (!displayChainPassUrl) {
      console.warn('No ChainPass URL available for redirect.');
      return;
    }

    window.location.assign(displayChainPassUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[520px] relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center mt-10 mb-8 animate-fade-in">
          <img src={vairifyLogo} alt="VAIRIFY" className="w-20 h-20" />
        </div>

        {/* Success Checkmark Animation */}
        <div className="flex items-center justify-center mb-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#10b981]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-white text-center mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Account Created Successfully!
        </h1>

        {/* Divider */}
        <div className="w-4/5 h-px bg-white/10 mx-auto mb-8"></div>

        {/* CARD 1 - What is V.A.I.? */}
        <div className="bg-[rgba(30,58,138,0.3)] backdrop-blur-[10px] border border-white/10 rounded-3xl p-6 mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-semibold text-white mb-4">One More Step</h2>
          <p className="text-base text-white/80 leading-relaxed mb-6">
            To unlock DateGuard, VAI-CHECK, and TruRevu, you need a V.A.I. (Verified Anonymous Identity).
          </p>

          {/* Visual Diagram */}
          <div className="bg-gradient-to-r from-[#4169e1] to-[#3b5998] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
              <User className="w-8 h-8 text-white/60" />
            </div>
            <div className="text-2xl text-white/50">+</div>
            <div className="bg-white/10 px-4 py-3 rounded-lg">
              <span className="font-mono text-xl text-white font-semibold">9I7T35L</span>
            </div>
          </div>

          <p className="text-base font-medium text-white text-center mb-4">
            A verified photo + unique code
          </p>

          {/* Bullet list */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-white/80 leading-relaxed">Proves you're real (verified with ID)</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-white/80 leading-relaxed">Keeps you private (no name/address stored)</span>
            </div>
            <div className="flex items-start gap-2">
              <Repeat className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-white/80 leading-relaxed">Works for every encounter</span>
            </div>
          </div>
        </div>

        {/* CARD 2 - How It Works */}
        <div className="bg-[rgba(30,58,138,0.3)] backdrop-blur-[10px] border border-white/10 rounded-3xl p-6 mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-semibold text-white mb-4">How it works:</h3>
          
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">1️⃣</span>
              <span className="text-base text-white/80 leading-relaxed">Go to ChainPass (our verification partner)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">2️⃣</span>
              <span className="text-base text-white/80 leading-relaxed">Upload your government ID</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">3️⃣</span>
              <span className="text-base text-white/80 leading-relaxed">Take a quick selfie</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">4️⃣</span>
              <span className="text-base text-white/80 leading-relaxed">Return here with your V.A.I.</span>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
              <span className="text-base">⏱️</span>
              <span className="text-sm text-white/70">Takes 3 minutes</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
              <span className="text-base">🔒</span>
              <span className="text-sm text-white/70">Identity data never reaches Vairify</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
              <span className="text-base">✓</span>
              <span className="text-sm text-white/70">Required for all safety features</span>
            </div>
          </div>
        </div>

        {/* CARD 3 - What You'll Need */}
        <div className="bg-[rgba(30,58,138,0.3)] backdrop-blur-[10px] border border-white/10 rounded-3xl p-5 mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-lg font-semibold text-white mb-3">You'll need:</h3>
          
          <div className="space-y-2">
            <div className="text-base text-white/80 leading-relaxed">• Government ID (license, passport, etc.)</div>
            <div className="text-base text-white/80 leading-relaxed">• Smartphone camera</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Button
            onClick={handleGetVAI}
            className="w-full h-14 bg-white text-[#1e40af] text-base font-semibold rounded-xl shadow-lg hover:bg-[#f3f4f6] hover:scale-[1.02] transition-all duration-150"
          >
            Get My V.A.I. Now (3 min)
          </Button>

          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            className="w-full h-14 border-2 border-white text-white text-base font-semibold rounded-xl hover:bg-white hover:text-[#1e40af] transition-all duration-150"
          >
            Continue to Pricing
          </Button>

          <p className="text-sm text-white/60 text-center max-w-[480px] mx-auto leading-relaxed mt-4">
            Note: DateGuard, VAI-CHECK, and TruRevu will be locked until you complete V.A.I. verification.
          </p>
        </div>

        <div className="mt-8 text-center text-white/70 text-sm animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <p>ChainPass Verification Portal URL</p>
          <p className="font-mono text-base text-white mt-1">{displayChainPassUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default Success;
