import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Info, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import vairifyLogo from "@/assets/vairify-logo.png";

interface FormData {
  email: string;
  password: string;
  referralVAI: string;
  couponCode: string;
  termsAccepted: boolean;
  hasExistingVAI: boolean;
  existingVAINumber: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  referralVAI?: string;
  couponCode?: string;
  termsAccepted?: string;
  existingVAINumber?: string;
}

interface PasswordStrength {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
  };
}

const Registration = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    referralVAI: '',
    couponCode: '',
    termsAccepted: false,
    hasExistingVAI: false,
    existingVAINumber: '',
  });
  const [checkingVAI, setCheckingVAI] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    strength: 'weak',
    score: 0,
    checks: {
      minLength: false,
      hasUppercase: false,
      hasNumber: false,
    },
  });

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (score === 3) strength = 'strong';
    else if (score === 2) strength = 'medium';

    return { strength, score, checks };
  };

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) 
          return 'Password must contain uppercase, lowercase, and number';
        break;
      case 'referralVAI':
        if (value && !/^[A-Z0-9]{7}$/.test(value)) 
          return 'V.A.I. codes are 7 characters (letters and numbers only)';
        break;
      case 'couponCode':
        if (value && !/^[A-Z]{2}\d{4}$/.test(value)) 
          return 'Coupon format: 2 letters + 4 digits (e.g., FC0001)';
        break;
      case 'existingVAINumber':
        if (formData.hasExistingVAI && !value) 
          return 'Please enter your VAI number';
        if (formData.hasExistingVAI && value && !/^[A-Z0-9]{7,}$/.test(value)) 
          return 'VAI number format is invalid';
        break;
      case 'termsAccepted':
        if (!value) return 'You must agree to the Terms of Service';
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    if (touched[name]) {
      const error = validateField(name as keyof FormData, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, formData[name as keyof FormData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key as keyof FormData, formData[key as keyof FormData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    
    try {
      // Import supabase client
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Create signup session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('signup_sessions')
        .insert({
          email: formData.email,
          referral_vai: formData.referralVAI || null,
          coupon_code: formData.couponCode || null,
          has_existing_vai: formData.hasExistingVAI,
          existing_vai_number: formData.hasExistingVAI ? formData.existingVAINumber : null,
        })
        .select('session_id')
        .single();

      if (sessionError) {
        console.error('Failed to create signup session:', sessionError);
        throw new Error('Failed to create session. Please try again.');
      }

      if (!sessionData?.session_id) {
        throw new Error('Session creation failed. Please try again.');
      }

      const sessionId = sessionData.session_id;

      // If user has existing VAI, check requirements with ChainPass
      if (formData.hasExistingVAI && formData.existingVAINumber) {
        setCheckingVAI(true);
        
        try {
          const { data: vaiCheckData, error: vaiCheckError } = await supabase.functions.invoke('check-vai-requirements', {
            body: {
              vai_number: formData.existingVAINumber.toUpperCase(),
              session_id: sessionId
            }
          });

          if (vaiCheckError) throw vaiCheckError;

          if (!vaiCheckData?.success) {
            throw new Error(vaiCheckData?.error || 'Failed to check VAI requirements');
          }

          const vaiStatus = vaiCheckData.status;

          // Store password temporarily in session
          await supabase
            .from('signup_sessions')
            .update({ 
              password_hash: formData.password // TODO: Hash password before storing
            })
            .eq('session_id', sessionId);

          // Store form data temporarily
          sessionStorage.setItem('vairify_user', JSON.stringify(formData));
          sessionStorage.setItem('signup_session_id', sessionId);
          sessionStorage.setItem('vai_status', vaiStatus);
          sessionStorage.setItem('existing_vai_number', formData.existingVAINumber.toUpperCase());
          if (formData.couponCode) {
            sessionStorage.setItem('founding_coupon', formData.couponCode);
          }

          // Route based on VAI status
          if (vaiStatus === 'fully_qualified') {
            // Skip ChainPass, go to email verification then profile
            toast.success("VAI verified! Sending verification code...");
            
            const { data, error } = await supabase.functions.invoke('send-verification-otp', {
              body: { email: formData.email, resend: false }
            });

            if (error) throw error;
            
            navigate("/onboarding/verify-otp");
            return;
          } else if (vaiStatus === 'missing_requirements') {
            // Redirect to ChainPass completion (LE disclosure + signature only)
            toast.info("VAI found but missing requirements. Redirecting to ChainPass...");
            const chainpassUrl = `${import.meta.env.VITE_CHAINPASS_URL || 'https://chainpass.com'}/complete-requirements?session_id=${sessionId}&vai=${formData.existingVAINumber.toUpperCase()}`;
            window.location.href = chainpassUrl;
            return;
          } else {
            // Invalid VAI - proceed with full ChainPass VAI creation
            toast.warning("VAI not found. Proceeding with new VAI creation...");
            // Continue to normal flow below
          }
        } catch (vaiError: any) {
          console.error('VAI check error:', vaiError);
          toast.error(vaiError.message || "Failed to verify VAI. Proceeding with new VAI creation...");
          // Continue to normal flow
        } finally {
          setCheckingVAI(false);
        }
      }

      // Normal flow: Store password and send OTP
      await supabase
        .from('signup_sessions')
        .update({ 
          password_hash: formData.password // TODO: Hash password before storing
        })
        .eq('session_id', sessionId);

      // Send verification OTP to email
      const { data, error } = await supabase.functions.invoke('send-verification-otp', {
        body: { email: formData.email, resend: false }
      });

      if (error) throw error;

      // Store form data temporarily for after verification
      sessionStorage.setItem('vairify_user', JSON.stringify(formData));
      sessionStorage.setItem('signup_session_id', sessionId);
      if (formData.couponCode) {
        sessionStorage.setItem('founding_coupon', formData.couponCode);
      }
      
      toast.success("Verification code sent! Please check your email.");
      navigate("/onboarding/verify-otp");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
      setCheckingVAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/onboarding/role")}
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
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Create Your Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-base">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25"
                  placeholder="your@email.com"
                />
                {touched.email && !errors.email && formData.email && (
                  <Check className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                )}
              </div>
              {touched.email && errors.email && (
                <p className="text-red-300 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-white text-base">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25 pr-12"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-4">
                  <div className="flex gap-[2px]">
                    <div 
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: passwordStrength.score >= 1 
                          ? passwordStrength.strength === 'weak' ? '#ef4444' 
                          : passwordStrength.strength === 'medium' ? '#f59e0b' 
                          : '#10b981'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <div 
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: passwordStrength.score >= 2 
                          ? passwordStrength.strength === 'medium' ? '#f59e0b' 
                          : passwordStrength.strength === 'strong' ? '#10b981'
                          : 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <div 
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: passwordStrength.score === 3 ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        passwordStrength.checks.minLength 
                          ? 'bg-[#10b981] border-[#10b981] scale-100' 
                          : 'border-[#9ca3af] scale-80'
                      }`}>
                        {passwordStrength.checks.minLength && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span 
                        className="text-sm transition-colors duration-200"
                        style={{ color: passwordStrength.checks.minLength ? '#10b981' : '#9ca3af' }}
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        passwordStrength.checks.hasUppercase 
                          ? 'bg-[#10b981] border-[#10b981] scale-100' 
                          : 'border-[#9ca3af] scale-80'
                      }`}>
                        {passwordStrength.checks.hasUppercase && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span 
                        className="text-sm transition-colors duration-200"
                        style={{ color: passwordStrength.checks.hasUppercase ? '#10b981' : '#9ca3af' }}
                      >
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        passwordStrength.checks.hasNumber 
                          ? 'bg-[#10b981] border-[#10b981] scale-100' 
                          : 'border-[#9ca3af] scale-80'
                      }`}>
                        {passwordStrength.checks.hasNumber && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span 
                        className="text-sm transition-colors duration-200"
                        style={{ color: passwordStrength.checks.hasNumber ? '#10b981' : '#9ca3af' }}
                      >
                        One number
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {touched.password && errors.password && (
                <p className="text-red-300 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="couponCode" className="text-white text-lg font-bold">
                Founding Member Coupon Code
              </Label>
              <Input
                id="couponCode"
                name="couponCode"
                value={formData.couponCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, couponCode: value }));
                  if (touched.couponCode) {
                    const error = validateField('couponCode', value);
                    setErrors(prev => ({ ...prev, couponCode: error }));
                  }
                }}
                onBlur={() => handleBlur('couponCode')}
                className="h-12 bg-white/20 border-white/30 text-white dark:text-white placeholder:text-white/50 focus:bg-white/25 text-base font-semibold"
                placeholder="FC0001 / FM1001 / EA3001"
                maxLength={6}
              />
              {touched.couponCode && errors.couponCode && (
                <p className="text-red-300 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.couponCode}
                </p>
              )}
            </div>

            {/* Existing VAI Number */}
            <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="hasExistingVAI"
                  checked={formData.hasExistingVAI}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      hasExistingVAI: checked as boolean,
                      existingVAINumber: checked ? prev.existingVAINumber : ''
                    }));
                    setTouched(prev => ({ ...prev, hasExistingVAI: true }));
                  }}
                  className="mt-1 bg-white/20 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                />
                <label htmlFor="hasExistingVAI" className="text-white/90 text-sm leading-relaxed cursor-pointer flex-1">
                  I have a VAI number from another platform
                </label>
              </div>
              
              {formData.hasExistingVAI && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="existingVAINumber" className="text-white text-sm">
                    Your VAI Number <span className="text-white/70">(from ChainPass or another platform)</span>
                  </Label>
                  <Input
                    id="existingVAINumber"
                    name="existingVAINumber"
                    value={formData.existingVAINumber}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormData(prev => ({ ...prev, existingVAINumber: value }));
                      if (touched.existingVAINumber) {
                        const error = validateField('existingVAINumber', value);
                        setErrors(prev => ({ ...prev, existingVAINumber: error }));
                      }
                    }}
                    onBlur={() => handleBlur('existingVAINumber')}
                    className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25 font-mono"
                    placeholder="Enter your VAI number"
                    maxLength={20}
                  />
                  {touched.existingVAINumber && errors.existingVAINumber && (
                    <p className="text-red-300 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.existingVAINumber}
                    </p>
                  )}
                  <p className="text-xs text-white/60">
                    We'll verify your VAI and check if any additional requirements are needed.
                  </p>
                </div>
              )}
            </div>

            {/* Referral VAI */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="referralVAI" className="text-white text-base">Referral V.A.I. (Optional)</Label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-white/70 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] bg-[#1f2937] text-white text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    If someone referred you, enter their V.A.I. code. You'll both earn revenue share benefits.
                  </div>
                </div>
              </div>
              <Input
                id="referralVAI"
                name="referralVAI"
                value={formData.referralVAI}
                onChange={handleChange}
                onBlur={() => handleBlur('referralVAI')}
                className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25"
                placeholder="Example: 9I7T35L"
                maxLength={7}
              />
              {touched.referralVAI && errors.referralVAI && (
                <p className="text-red-300 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.referralVAI}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }));
                    setTouched(prev => ({ ...prev, termsAccepted: true }));
                  }}
                  className="mt-1 bg-white/20 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                />
                <label htmlFor="terms" className="text-white/90 text-sm leading-relaxed cursor-pointer">
                  I have read and agree to the{" "}
                  <a href="/terms" className="underline hover:text-white">Terms of Service</a> and{" "}
                  <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>, and confirm I am at least 18 years of age
                </label>
              </div>
              {touched.termsAccepted && errors.termsAccepted && (
                <p className="text-red-300 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.termsAccepted}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || checkingVAI}
              className="w-full h-14 text-lg font-semibold bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {checkingVAI ? "Verifying VAI..." : isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-white/90 hover:text-white text-sm transition-colors"
            >
              Already have an account? <span className="underline font-semibold">Login</span>
            </button>

            {/* Language Indicator */}
            <p className="w-full text-center text-sm text-white/60 mt-4">
              🌐 Language: English (Change in Settings)
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
