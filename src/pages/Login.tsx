import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, Key, Camera, ArrowLeft, Phone, HelpCircle, Shield } from "lucide-react";
import vairifyLogo from "@/assets/vairify-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FacialRecognitionLogin from "@/components/auth/FacialRecognitionLogin";

type Screen = "identity" | "vai-auth" | "email-auth" | "forgot-password" | "phone-otp" | "trouble-signin" | "signup";
type IdentityMethod = "vai" | "email" | "phone";
type AuthMethod = "face" | "password";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Screen flow state
  const [screen, setScreen] = useState<Screen>("identity");
  const [identityMethod, setIdentityMethod] = useState<IdentityMethod>("email");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [vaiNumber, setVaiNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Polling state for VAI verification data
  const [pollingForVAI, setPollingForVAI] = useState(false);
  const [pollingMessage, setPollingMessage] = useState("");

  // Sign out any existing session first
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  // Check for VAI parameter in URL and auto-select face scan
  useEffect(() => {
    const vai = searchParams.get("vai");
    if (vai) {
      setIdentityMethod("vai");
      setVaiNumber(vai);
      setScreen("vai-auth");
      setAuthMethod("face"); // Auto-select face scan for first-time users from ChainPass
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has username before redirecting
        const { data: profile } = await supabase
          .from('provider_profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.username) {
          navigate('/feed');
        } else {
          navigate('/pricing');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  // Poll for VAI verification data from ChainPass
  const pollForVAIVerification = async (userId: string, maxAttempts = 20): Promise<boolean> => {
    setPollingForVAI(true);
    setPollingMessage("Waiting for verification data from ChainPass...");
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('vai_verifications')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data && !error) {
          setPollingMessage("Verification data received!");
          setPollingForVAI(false);
          return true;
        }

        // Wait 1.5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPollingMessage(`Waiting for verification data... (${attempt + 1}/${maxAttempts})`);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }

    setPollingForVAI(false);
    return false;
  };

  const handleIdentitySelect = (method: IdentityMethod) => {
    setIdentityMethod(method);
    if (method === "vai") {
      setScreen("vai-auth");
    } else if (method === "email") {
      setScreen("email-auth");
    } else if (method === "phone") {
      setScreen("phone-otp");
    }
  };

  const handleBack = () => {
    setScreen("identity");
    setVaiNumber("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setOtpCode("");
    setResetEmail("");
    setAuthMethod("face");
  };

  const handleForgotPassword = () => {
    setScreen("forgot-password");
  };

  const handleTroubleSignin = () => {
    setScreen("trouble-signin");
  };

  const handleSendPasswordReset = () => {
    // TODO: Implement password reset email
    console.log("Sending password reset to:", resetEmail);
    // Show success message and return to login
    alert("Password reset link sent! Check your email.");
    handleBack();
  };

  const handleSendOTP = () => {
    // TODO: Implement SMS OTP sending
    console.log("Sending OTP to:", phoneNumber);
    alert("OTP code sent to your phone!");
  };

  const handleVerifyOTP = () => {
    // TODO: Implement OTP verification
    console.log("Verifying OTP:", otpCode);
    navigate('/feed');
  };

  const [showFacialRecognition, setShowFacialRecognition] = useState(false);
  const [storedPhotoUrl, setStoredPhotoUrl] = useState<string | null>(null);

  const handleFaceScan = async () => {
    if (!vaiNumber || vaiNumber.length !== 7) {
      toast({
        title: "Invalid V.A.I. Number",
        description: "Please enter your 7-character V.A.I. number first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch stored photo URL from vai_verifications
      const { data: verification, error } = await supabase
        .from('vai_verifications')
        .select('biometric_photo_url')
        .eq('vai_number', vaiNumber.toUpperCase())
        .single();

      if (error || !verification?.biometric_photo_url) {
        toast({
          title: "V.A.I. Not Found",
          description: "Could not find your V.A.I. number. Please check and try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setStoredPhotoUrl(verification.biometric_photo_url);
      setShowFacialRecognition(true);
    } catch (error: any) {
      console.error('Error fetching VAI verification:', error);
      toast({
        title: "Error",
        description: "Failed to load verification data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacialRecognitionSuccess = async () => {
    // Facial recognition successful - authenticate user via edge function
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-vai-login', {
        body: {
          vaiNumber: vaiNumber.toUpperCase(),
          facialAuth: true, // Flag for facial authentication
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Authentication failed');
      }

      // Store login preference
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data?.sessionUrl) {
        // Update login preference
        await supabase
          .from('profiles')
          .update({ login_preference: 'facial' })
          .eq('id', user.id);

        // Redirect with session
        window.location.href = data.sessionUrl;
      } else if (data?.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No session URL received');
      }
    } catch (error: any) {
      console.error('Facial recognition auth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive"
      });
      setShowFacialRecognition(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFacialRecognitionFailure = () => {
    setShowFacialRecognition(false);
    toast({
      title: "Verification Failed",
      description: "Face verification failed. Please try again or use email/password.",
      variant: "destructive"
    });
  };

  const handleFacialRecognitionFallback = () => {
    setShowFacialRecognition(false);
    setAuthMethod("password");
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('🔐 Attempting login with email:', email);
    console.log('🔐 Password length:', password.length);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw error;
      }
      
      console.log('✅ Login successful, user ID:', data.user.id);

      // Store login preference
      await supabase
        .from('profiles')
        .update({ login_preference: identityMethod === 'vai' ? 'facial' : 'password' })
        .eq('id', data.user.id);

      toast({
        title: "Welcome back!",
        description: "Successfully signed in"
      });
      
      // Check if user has completed profile with username
      const { data: profile } = await supabase
        .from('provider_profiles')
        .select('username')
        .eq('user_id', data.user.id)
        .single();

      if (profile?.username) {
        // Has username, go to feed
        navigate('/feed');
      } else {
        // No username - check if they're a founding member
        const stored = sessionStorage.getItem('vairify_user');
        const couponCode = stored ? JSON.parse(stored).referralVAI : null;
        
        if (couponCode && /^(FC|FM|EA)\d{4}$/i.test(couponCode)) {
          // Founding member - show welcome page
          navigate('/onboarding/founding-member');
        } else {
          // Regular user - go to pricing
          navigate('/pricing');
        }
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-creation`
        }
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Please choose your membership tier"
      });
      
      // New users go to pricing first, then profile creation
      navigate('/pricing');
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setIsSignup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="pt-12 md:pt-16 pb-8 text-center">
        <img 
          src={vairifyLogo} 
          alt="Vairify" 
          className="h-16 md:h-20 mx-auto mb-4"
        />
        <h1 className="text-white text-2xl font-light mb-2">Welcome Back</h1>
        <p className="text-white/70 text-sm md:text-base">
          {screen === "identity" ? "Sign in to your account" : "Verify your identity"}
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[440px]">
          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
            {/* SCREEN 1: Identity Selection */}
            {screen === "identity" && (
              <div className="space-y-8">
                <h2 className="text-foreground text-2xl font-semibold">
                  How would you like to identify yourself?
                </h2>

                {/* V.A.I. Option (Primary) */}
                <button
                  onClick={() => handleIdentitySelect("vai")}
                  className="w-full h-[100px] border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all duration-200 p-4 flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <Key className="w-12 h-12 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground text-lg font-semibold">
                        I have my V.A.I. Number
                      </span>
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">Most Secure</p>
                  </div>
                </button>

                {/* Email Option (Fallback) */}
                <button
                  onClick={() => handleIdentitySelect("email")}
                  className="w-full h-[100px] border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all duration-200 p-4 flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <Mail className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-foreground text-lg font-semibold block mb-1">
                      I'll use my Email
                    </span>
                    <p className="text-muted-foreground text-sm">If you forgot your V.A.I.</p>
                  </div>
                </button>

                {/* Help Text */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Don't know your V.A.I. number? Use email - we'll show it on your dashboard after you login.
                </p>
              </div>
            )}

            {/* SCREEN 2A: V.A.I. Authentication */}
            {screen === "vai-auth" && (
              <div className="space-y-6">
                {/* Back Button - Only show if NOT coming from ChainPass */}
                {!searchParams.get("vai") && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                )}

                {/* Welcome Hero Message - Show when coming from ChainPass */}
                {searchParams.get("vai") && (
                  <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-2 border-primary/20 rounded-xl p-6 mb-6">
                    <div className="text-center space-y-3">
                      <div className="text-3xl">🎉</div>
                      <h2 className="text-foreground text-xl font-semibold leading-tight">
                        Welcome to Vairify!
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        You're joining a verified community where every connection is real. Your V.A.I. unlocks safer connections with complete privacy and total accountability.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium pt-2">
                        <Shield className="w-4 h-4" />
                        <span>Verified & Secure</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* V.A.I. Input */}
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    V.A.I. Number
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      type="text"
                      placeholder="Enter your 7-character V.A.I."
                      value={vaiNumber}
                      onChange={(e) => setVaiNumber(e.target.value.toUpperCase())}
                      maxLength={7}
                      className="h-14 pl-10 pr-4 text-base font-mono"
                      readOnly={!!searchParams.get("vai")}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 ml-1">
                    {searchParams.get("vai") ? "Your V.A.I. from ChainPass" : "Example: ABC123D"}
                  </p>
                </div>

                {/* Authentication Method Selection */}
                <div className="space-y-4">
                  <h3 className="text-foreground text-xl font-semibold">
                    {searchParams.get("vai") ? "Ready to verify your identity" : "How would you like to authenticate?"}
                  </h3>

                  {authMethod === "face" ? (
                    <>
                      {showFacialRecognition && storedPhotoUrl ? (
                        <FacialRecognitionLogin
                          vaiNumber={vaiNumber}
                          storedPhotoUrl={storedPhotoUrl}
                          onSuccess={handleFacialRecognitionSuccess}
                          onFailure={handleFacialRecognitionFailure}
                          onFallback={handleFacialRecognitionFallback}
                        />
                      ) : (
                        <>
                          {/* Polling Message */}
                          {pollingForVAI && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                <p className="text-sm text-foreground">{pollingMessage}</p>
                              </div>
                            </div>
                          )}

                          {/* Face Scan Button */}
                          <button
                            onClick={handleFaceScan}
                            disabled={vaiNumber.length !== 7 || loading || pollingForVAI}
                            className="w-full h-[160px] bg-gradient-primary hover:brightness-110 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex flex-col items-center justify-center gap-3"
                          >
                            {loading || pollingForVAI ? (
                              <>
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-foreground"></div>
                                <span className="text-primary-foreground text-xl font-semibold">
                                  {pollingForVAI ? 'Syncing...' : 'Verifying...'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-16 h-16 text-primary-foreground" strokeWidth={1.5} />
                                <span className="text-primary-foreground text-xl font-semibold">
                                  Scan My Face to Sign In
                                </span>
                                <span className="text-primary-foreground/90 text-sm">
                                  Fastest & Most Secure Method
                                </span>
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {/* Divider */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-4 text-sm text-muted-foreground bg-card">OR</span>
                        </div>
                      </div>

                      {/* Switch to Password */}
                      <button
                        onClick={() => setAuthMethod("password")}
                        className="w-full text-primary hover:text-primary-light transition-colors flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span className="text-base font-medium">Use password instead</span>
                      </button>
                      <p className="text-muted-foreground text-sm text-center">
                        If camera is not working
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Password Input */}
                      <div>
                        <label className="block text-foreground text-sm font-medium mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 pl-10 pr-12 text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button 
                            onClick={handleForgotPassword}
                            className="text-sm text-primary hover:text-primary-light hover:underline transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      {/* Sign In Button */}
                      <Button
                        onClick={handlePasswordLogin}
                        disabled={vaiNumber.length !== 7 || !password}
                        className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Sign In with Password
                      </Button>

                      {/* Alternative Method Suggestion */}
                      <p className="text-muted-foreground text-sm text-center">
                        Want the faster method?{" "}
                        <button
                          onClick={() => setAuthMethod("face")}
                          className="text-primary hover:text-primary-light hover:underline"
                        >
                          Use face scan above
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* SCREEN 2B: Email Authentication */}
            {screen === "email-auth" && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                {/* Email Input */}
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-10 pr-4 text-base"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-10 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:text-primary-light hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Sign In/Sign Up Button */}
                <Button
                  onClick={isSignup ? handleSignup : handlePasswordLogin}
                  disabled={!email || !password || loading}
                  className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In Securely"}
                </Button>

                {/* Toggle Sign In/Sign Up */}
                <div className="text-center pt-4">
                  <p className="text-muted-foreground text-sm">
                    {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                      onClick={() => setIsSignup(!isSignup)}
                      className="text-primary hover:text-primary-light hover:underline font-medium"
                    >
                      {isSignup ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div>

                {/* Alternative Method - Face ID */}
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm text-center mb-3">
                    Want to skip typing your password?
                  </p>
                  <Button
                    onClick={() => {
                      setAuthMethod("face");
                    }}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Use Face ID Instead
                  </Button>
                </div>

                {/* Info Text */}
                <p className="text-muted-foreground text-sm text-center">
                  Don't know your V.A.I.? It will be shown on your dashboard after login.
                </p>
              </div>
            )}

            {/* SCREEN 3: Forgot Password */}
            {screen === "forgot-password" && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to login</span>
                </button>

                <div className="text-center mb-6">
                  <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-foreground text-2xl font-semibold mb-2">
                    Reset Your Password
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We'll send you a secure link to reset your password
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your registered email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="h-14 pl-10 pr-4 text-base"
                    />
                  </div>
                </div>

                {/* Send Reset Link Button */}
                <Button
                  onClick={handleSendPasswordReset}
                  disabled={!resetEmail}
                  className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
                >
                  Send Reset Link
                </Button>

                {/* Alternative Help */}
                <div className="pt-4 border-t border-border text-center">
                  <p className="text-muted-foreground text-sm mb-3">
                    Can't access your email?
                  </p>
                  <button
                    onClick={() => setScreen("phone-otp")}
                    className="text-primary hover:text-primary-light hover:underline text-sm font-medium"
                  >
                    Try Phone Verification Instead
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 4: Phone OTP */}
            {screen === "phone-otp" && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to login</span>
                </button>

                <div className="text-center mb-6">
                  <Phone className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-foreground text-2xl font-semibold mb-2">
                    Emergency Phone Access
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We'll send a one-time code to your registered phone
                  </p>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-14 pl-10 pr-4 text-base"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 ml-1">
                    Must match the phone on your account
                  </p>
                </div>

                {phoneNumber && !otpCode ? (
                  <Button
                    onClick={handleSendOTP}
                    className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
                  >
                    Send Verification Code
                  </Button>
                ) : phoneNumber && otpCode ? (
                  <>
                    {/* OTP Code Input */}
                    <div>
                      <label className="block text-foreground text-sm font-medium mb-2">
                        Verification Code
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="h-14 text-center text-2xl font-mono tracking-widest"
                      />
                      <p className="text-muted-foreground text-xs mt-2 text-center">
                        Code sent to {phoneNumber}
                      </p>
                    </div>

                    <Button
                      onClick={handleVerifyOTP}
                      disabled={otpCode.length !== 6}
                      className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
                    >
                      Verify & Sign In
                    </Button>

                    <button
                      onClick={handleSendOTP}
                      className="w-full text-center text-sm text-primary hover:text-primary-light hover:underline"
                    >
                      Didn't receive code? Resend
                    </button>
                  </>
                ) : null}

                {/* Security Notice */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Security Note:</strong> This emergency access method should only be used when you cannot access your email. For security reasons, this option may require additional verification steps.
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 5: Trouble Signing In Hub */}
            {screen === "trouble-signin" && (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back to login</span>
                </button>

                <div className="text-center mb-6">
                  <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-foreground text-2xl font-semibold mb-2">
                    Having Trouble?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Choose the option that best describes your situation
                  </p>
                </div>

                {/* Help Options */}
                <div className="space-y-3">
                  <button
                    onClick={() => setScreen("forgot-password")}
                    className="w-full p-4 border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-foreground font-semibold mb-1">
                          I forgot my password
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Reset your password via email
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setScreen("phone-otp")}
                    className="w-full p-4 border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-foreground font-semibold mb-1">
                          I can't access my email
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Use phone verification as backup
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setScreen("vai-auth");
                      setAuthMethod("face");
                    }}
                    className="w-full p-4 border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-foreground font-semibold mb-1">
                          I know my V.A.I. number
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Use V.A.I. + Face ID (fastest method)
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setScreen("email-auth");
                      setAuthMethod("face");
                    }}
                    className="w-full p-4 border-2 border-border hover:border-primary rounded-xl bg-card hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-foreground font-semibold mb-1">
                          My camera isn't working
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Try password login instead
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Contact Support */}
                <div className="pt-4 border-t border-border text-center">
                  <p className="text-muted-foreground text-sm mb-2">
                    Still need help?
                  </p>
                  <a 
                    href="#"
                    className="text-primary hover:text-primary-light hover:underline text-sm font-medium"
                  >
                    Contact Support Team
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Help Link - Shows on main screens only */}
          {(screen === "identity" || screen === "vai-auth" || screen === "email-auth") && (
            <div className="mt-6 text-center">
              <button
                onClick={handleTroubleSignin}
                className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2 mx-auto group"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Having trouble signing in?</span>
              </button>
            </div>
          )}

          {/* Footer Section */}
          <div className="mt-8 text-center space-y-6">
            {/* Legal Text */}
            <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary-light hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary-light hover:underline">
                Privacy Policy
              </a>
            </p>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <Lock className="h-3 w-3" />
              <span>256-bit Encryption</span>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
