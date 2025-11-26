import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";
import { ManualVerificationRequestFlow } from "@/components/vai-check/ManualVerificationRequestFlow";

export default function FaceScanProvider() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [failureReason, setFailureReason] = useState<'system_failure' | 'individual_issue' | 'failed_verification'>('failed_verification');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vaiPhotoUrl, setVaiPhotoUrl] = useState<string | null>(null);

  const handleCapture = async () => {
    const video = document.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    setIsScanning(false);
    setIsVerifying(true);

    // Verify face against V.A.I. biometric photo
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to verify your identity",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      // Get user's V.A.I. verification data
      const { data: vaiVerification } = await supabase
        .from('vai_verifications')
        .select('biometric_photo_url, vai_number')
        .eq('user_id', user.id)
        .single();

      if (!vaiVerification) {
        toast({
          title: "V.A.I. not found",
          description: "Please complete V.A.I. verification first",
          variant: "destructive"
        });
        navigate("/onboarding/success");
        return;
      }

      // Create session first (needed for manual fallback)
      const { data: session, error: sessionError } = await supabase
        .from('vai_check_sessions')
        .insert({
          provider_id: user.id,
          provider_face_url: imageData,
          status: 'initiated'
        })
        .select()
        .single();

      if (sessionError || !session) {
        throw sessionError || new Error('Failed to create session');
      }

      setSessionId(session.id);
      setVaiPhotoUrl(vaiVerification.biometric_photo_url);

      // TODO: Implement actual face verification against biometric_photo_url
      // For now, simulate verification failure to test manual fallback
      // In production, replace this with actual face verification API call
      const verificationSuccess = false; // Simulate failure for testing

      if (!verificationSuccess) {
        // Face verification failed - show manual fallback
        setIsVerifying(false);
        setFailureReason('failed_verification'); // Could be 'system_failure', 'individual_issue', or 'failed_verification'
        setShowManualFallback(true);
        return;
      }

      // Verification succeeded - update session and proceed
      const { error: updateError } = await supabase
        .from('vai_check_sessions')
        .update({
          provider_face_verified: true,
          status: 'qr_shown',
          verification_method: 'automated'
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      toast({
        title: "✅ Verified",
        description: "Identity confirmed"
      });

      setTimeout(() => {
        navigate(`/vai-check/show-qr/${session.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Face verification error:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Could not verify identity",
        variant: "destructive"
      });
      setIsVerifying(false);
      setIsScanning(true);
    }
  };

  const handleManualVerificationComplete = () => {
    // Navigate to QR code page after manual verification is requested
    if (sessionId) {
      navigate(`/vai-check/show-qr/${sessionId}`);
    } else {
      navigate("/vai-check");
    }
  };

  const handleManualVerificationCancel = () => {
    // User wants to try again
    setShowManualFallback(false);
    setIsScanning(true);
    setCapturedImage(null);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-xl font-bold">Verifying your identity...</h2>
          <p className="text-white/60">Comparing to your verified photo</p>
        </div>
      </div>
    );
  }

  // Show manual verification fallback if verification failed
  if (showManualFallback && sessionId && capturedImage && vaiPhotoUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <ManualVerificationRequestFlow
              sessionId={sessionId}
              capturedSelfie={capturedImage}
              vaiPhotoUrl={vaiPhotoUrl}
              failureReason={failureReason}
              onComplete={handleManualVerificationComplete}
              onCancel={handleManualVerificationCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vai-check")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I.-CHECK</span>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Verify Your Identity</h1>
          <p className="text-white/80">Position your face in the box</p>
        </div>

        <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive={isScanning} onStreamReady={() => {}} />
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
            Face centered
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
            Good lighting
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
            Remove glasses if possible
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCapture}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
          >
            CAPTURE
          </Button>
        </div>
      </main>
    </div>
  );
}
