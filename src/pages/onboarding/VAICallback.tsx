import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import vairifyLogo from "@/assets/vairify-logo.png";

const VAICallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Checking your verification status...');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const checkVerification = async () => {
      // Get session_id from URL params
      const sessionId = searchParams.get('session_id');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user and we have a session_id, we need to create the user account
      if (!user && sessionId) {
        setMessage('Retrieving signup data...');
        
        try {
          // Retrieve signup session
          const { data: sessionData, error: sessionError } = await supabase
            .from('signup_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

          if (sessionError || !sessionData) {
            setStatus('error');
            setMessage('Session expired or invalid. Please sign up again.');
            return;
          }

          // Check if session expired
          if (new Date(sessionData.expires_at) < new Date()) {
            setStatus('error');
            setMessage('Session expired. Please sign up again.');
            
            // Delete expired session
            await supabase
              .from('signup_sessions')
              .delete()
              .eq('session_id', sessionId);
            
            return;
          }

          // Create user account if it doesn't exist
          // Note: User should already exist from VerifyOTP, but handle edge case
          const { data: existingUser } = await supabase.auth.getUser();
          
          if (!existingUser) {
            // Create auth user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
              email: sessionData.email,
              password: sessionData.password_hash || '', // Password should be hashed
              options: {
                emailRedirectTo: `${window.location.origin}/onboarding/vai-callback`,
              }
            });

            if (signUpError || !authData?.user) {
              setStatus('error');
              setMessage('Failed to create account. Please try again.');
              return;
            }
          }

          // Get the authenticated user
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            setStatus('error');
            setMessage('Authentication failed. Please try again.');
            return;
          }

          // Get the authenticated user (should exist after OTP verification)
          //const { data: { user: authUser } } = await supabase.auth.getUser();
          
          // Check if user has existing VAI that's fully qualified
          if (sessionData.has_existing_vai && sessionData.vai_status === 'fully_qualified' && sessionData.existing_vai_number && authUser) {
            // User has existing VAI - link it directly
            try {
              // Create VAI verification record with existing VAI
              const { error: vaiError } = await supabase
                .from('vai_verifications')
                .insert({
                  user_id: authUser.id,
                  vai_number: sessionData.existing_vai_number,
                  verification_status: 'verified',
                  verified_at: new Date().toISOString(),
                  verified_photo_url: null, // Will be updated if needed
                });

              if (vaiError && vaiError.code !== '23505') { // Ignore duplicate key errors
                console.error('Error creating VAI verification:', vaiError);
              }

              // Update profile with VAI
              await supabase
                .from('profiles')
                .upsert({
                  id: authUser.id,
                  vai_number: sessionData.existing_vai_number,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id'
                });

              // Link referral VAI and coupon code if provided
              if (sessionData.referral_vai || sessionData.coupon_code) {
                // Handle referral linking logic here
                console.log('Linking referral data:', {
                  referral_vai: sessionData.referral_vai,
                  coupon_code: sessionData.coupon_code
                });
              }

              // Delete signup session
              await supabase
                .from('signup_sessions')
                .delete()
                .eq('session_id', sessionId);

              // Redirect to profile setup (skip ChainPass)
              setStatus('success');
              setMessage('Your existing VAI has been linked! Redirecting to profile setup...');
              setTimeout(() => {
                navigate('/profile-wizard');
              }, 2000);
              return;
            } catch (error) {
              console.error('Error linking existing VAI:', error);
              // Continue with normal flow if linking fails
            }
          }

          // Link referral VAI and coupon code if provided
          if (sessionData.referral_vai || sessionData.coupon_code) {
            // Handle referral linking logic here
            // This would typically create referral records
            console.log('Linking referral data:', {
              referral_vai: sessionData.referral_vai,
              coupon_code: sessionData.coupon_code
            });
          }

          // Continue with normal VAI verification polling (for new VAI creation)
          // Existing VAI flow already handled above
        } catch (error) {
          console.error('Session retrieval error:', error);
          setStatus('error');
          setMessage('Failed to retrieve signup data. Please try again.');
          return;
        }
      }

      if (!user) {
        setStatus('error');
        setMessage('User not authenticated. Please log in.');
        return;
      }

      // Poll for V.A.I. verification data (max 30 seconds)
      const maxAttempts = 20;
      const pollInterval = 1500;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        setAttempts(attempt + 1);
        setMessage(`Waiting for verification data from ChainPass... (${attempt + 1}/${maxAttempts})`);

        try {
          const { data, error } = await supabase
            .from('vai_verifications')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data && !error) {
            console.log('V.A.I. verification found:', data);
            setStatus('success');
            setMessage('Verification complete! Redirecting...');
            
            // Wait 2 seconds then redirect to pricing
            setTimeout(() => {
              navigate('/pricing');
            }, 2000);
            return;
          }

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error) {
          console.error('Polling error:', error);
        }
      }

      // If we get here, verification data wasn't received
      setStatus('error');
      setMessage('Verification data not received yet. This might take a few moments. You can continue and check back later.');
    };

    checkVerification();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center justify-center mb-8">
        <img src={vairifyLogo} alt="VAIRIFY" className="w-20 h-20" />
      </div>

      {/* Status Card */}
      <div className="bg-card/80 backdrop-blur-lg border border-white/10 rounded-3xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          {status === 'checking' && (
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
          )}

          {/* Message */}
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {status === 'checking' && 'Processing Verification'}
            {status === 'success' && 'Verification Complete!'}
            {status === 'error' && 'Verification Pending'}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {message}
          </p>

          {/* Actions */}
          {status === 'error' && (
            <div className="flex flex-col gap-3 w-full">
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full"
              >
                Continue to Pricing
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Check Again
              </Button>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-sm text-muted-foreground">
              Attempt {attempts} of 20
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground mt-6 text-center max-w-md">
        Your verification data is being processed by ChainPass. This usually takes just a few moments.
      </p>
    </div>
  );
};

export default VAICallback;
