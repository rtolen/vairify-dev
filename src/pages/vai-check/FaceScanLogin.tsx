import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";

export default function FaceScanLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const vaiNumber = searchParams.get("vai");

  useEffect(() => {
    if (!vaiNumber) {
      toast({
        title: "Missing V.A.I. Number",
        description: "Please enter your V.A.I. number first",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [vaiNumber, navigate, toast]);

  const handleCapture = async () => {
    const video = document.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setIsScanning(false);
    setIsVerifying(true);

    try {
      // Call the verify-vai-login edge function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-vai-login', {
        body: {
          vaiNumber,
          faceImageBase64: imageData.split(',')[1]
        }
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Verification failed');
      }

      if (!verifyData?.success) {
        throw new Error(verifyData?.error || 'Face verification failed');
      }

      toast({
        title: "✅ Verified",
        description: "Identity confirmed! Signing you in..."
      });

      // Successfully verified - redirect with session
      if (verifyData.sessionUrl) {
        window.location.href = verifyData.sessionUrl;
      } else {
        throw new Error('No session URL received from verification');
      }
    } catch (error: any) {
      console.error('Face verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Face verification failed. Please try again.",
        variant: "destructive"
      });
      setIsScanning(true);
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-xl font-bold">Verifying your identity...</h2>
          <p className="text-white/60">Comparing with your verified photo</p>
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
          onClick={() => navigate("/login?vai=" + vaiNumber)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I. LOGIN</span>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Verify Your Identity</h1>
          <p className="text-white/80">V.A.I. {vaiNumber}</p>
          <p className="text-white/60 text-sm">Position your face in the box</p>
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
            CAPTURE & VERIFY
          </Button>
        </div>
      </main>
    </div>
  );
}
