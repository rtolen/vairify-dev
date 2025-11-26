import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";

export default function FinalVerification() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

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

    // Update session with final verification
    const field = role === 'provider' ? 'provider_final_verified' : 'client_final_verified';
    const faceField = role === 'provider' ? 'provider_final_face_url' : 'client_final_face_url';

    const { error } = await supabase
      .from('vai_check_sessions')
      .update({
        [field]: true,
        [faceField]: imageData
      })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        variant: "destructive"
      });
      return;
    }

    // Check if both verified
    const { data: session } = await supabase
      .from('vai_check_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (session && 
        (session as any).provider_final_verified && 
        (session as any).client_final_verified) {
      // Update status to completed
      await supabase
        .from('vai_check_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setTimeout(() => {
        navigate(`/vai-check/complete/${sessionId}`);
      }, 2000);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-xl font-bold">Verifying both identities...</h2>
          <div className="space-y-2 text-sm">
            <p className="text-green-400">✅ {role === 'provider' ? 'Sarah K.' : 'Alex M.'} verified</p>
            <p className="text-white/60">⏳ Verifying {role === 'provider' ? 'Alex M.' : 'Sarah K.'}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">📷 Final Verification</h1>
          <p className="text-white/80">One more quick face scan to confirm it's really you</p>
        </div>

        <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive={isScanning} onStreamReady={() => {}} />
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCapture}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            CAPTURE
          </Button>
        </div>
      </main>
    </div>
  );
}
