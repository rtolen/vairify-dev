import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import vairifyLogo from "@/assets/vairify-logo.png";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Get session data
    const storedSessionId = sessionStorage.getItem('signup_session_id');
    const storedUser = sessionStorage.getItem('vairify_user');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setEmail(userData.email || '');
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }

  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus last input
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP via edge function
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          email: email,
          otp: otpCode
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Invalid verification code');
      }

      // After OTP verification, create the user account
      // First, retrieve the signup session to get the password
      if (!sessionId) {
        throw new Error('Session ID not found. Please start over.');
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('signup_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Failed to retrieve signup data. Please start over.');
      }

      // Check if user already exists and is signed in
      const { data: { user: existingUser, session: existingSession } } = await supabase.auth.getUser();
      
      if (!existingUser || !existingSession) {
        // Try to sign in first (in case user was created but not signed in)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: sessionData.password_hash || '',
        });

        if (signInError || !signInData?.session) {
          // Sign in failed, so create the user account
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: sessionData.password_hash || '',
            options: {
              emailRedirectTo: `${window.location.origin}/onboarding/success`,
              data: {
                session_id: sessionId,
              }
            }
          });

          if (signUpError) {
            console.error('Sign up error:', signUpError);
            const alreadyRegistered =
              signUpError.message?.toLowerCase().includes('already registered') ||
              signUpError.message?.toLowerCase().includes('already exists');
            if (alreadyRegistered) {
              toast.error('That email already has an account. Please sign in.');
              navigate(`/login?error=email_exists&email=${encodeURIComponent(email || '')}`);
              return;
            }
            throw new Error(signUpError.message || 'Failed to create account. Please try again.');
          }

          if (!authData?.user) {
            throw new Error('Account creation failed. Please try again.');
          }

          // After signup, try to sign in again
          // If email confirmation is required, this might fail, but we'll handle it
          const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: sessionData.password_hash || '',
          });

          if (finalSignInError) {
            console.error('Final sign in error:', finalSignInError);
            // If email confirmation is required, the user might need to confirm
            // But since we verified via OTP, try to continue anyway
            // The session might have been created by signUp
          }

          // Verify we have a session now
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (!finalSession) {
            console.warn('No session created. User may need to sign in manually.');
            // Don't throw error, let the flow continue - user can sign in later
          }
        }
      }

      // Check if user has existing VAI
      const vaiStatus = sessionStorage.getItem('vai_status');
      const existingVAI = sessionStorage.getItem('existing_vai_number');

      if (vaiStatus === 'fully_qualified' && existingVAI) {
        // Skip ChainPass, go directly to VAI callback to link existing VAI
        toast.success("Email verified! Linking your existing VAI...");
        navigate(`/onboarding/vai-callback?session_id=${sessionId}`);
      } else if (vaiStatus === 'missing_requirements') {
        // Should have been redirected already, but handle edge case
        toast.success("Email verified! Redirecting to ChainPass...");
        navigate(`/onboarding/vai-callback?session_id=${sessionId}`);
      } else {
        // Normal new VAI creation flow
        toast.success("Email verified! Account created successfully.");
        navigate(`/onboarding/success?session_id=${sessionId}`);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || "Invalid verification code. Please try again.");
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not found. Please start over.");
      navigate("/onboarding/registration");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-verification-otp', {
        body: { email: email, resend: true }
      });

      if (error) throw error;

      toast.success("Verification code resent! Please check your email.");
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || "Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/onboarding/registration")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
          <img src={vairifyLogo} alt="VAIRIFY" className="w-30 h-30 md:w-48 md:h-48" />
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            Verify Your Email
          </h1>
          <p className="text-white/80 text-center mb-8">
            We sent a 6-digit code to <strong>{email || 'your email'}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="space-y-4">
              <Label className="text-white text-center block">Enter Verification Code</Label>
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/20 border-white/30 text-white focus:bg-white/25"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full h-14 text-lg font-semibold bg-white text-primary hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="text-white/80 hover:text-white text-sm underline"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
