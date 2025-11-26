import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FaceScanner from "@/components/dateguard/FaceScanner";

export default function ScanQRCode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [manualEntry, setManualEntry] = useState(false);
  const [vaiNumber, setVaiNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (scannedData: string) => {
    try {
      setIsProcessing(true);
      const data = JSON.parse(scannedData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please log in to continue",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      // Update session with client info
      const { error } = await supabase
        .from('vai_check_sessions')
        .update({
          client_id: user.id,
          status: 'mutual_review'
        })
        .eq('id', data.sessionId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to join session",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "QR Scanned!",
        description: "Loading profiles..."
      });

      setTimeout(() => {
        navigate(`/vai-check/mutual-view/${data.sessionId}/client`);
      }, 1500);
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualContinue = async () => {
    if (!vaiNumber) return;
    
    setIsProcessing(true);
    
    const { data: session } = await supabase
      .from('vai_check_sessions')
      .select('*')
      .eq('session_code', vaiNumber.toUpperCase())
      .eq('status', 'qr_generated')
      .single();

    if (!session) {
      toast({
        title: "Invalid V.A.I. Number",
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    await handleScan(JSON.stringify({ sessionId: session.id }));
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (manualEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setManualEntry(false)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm">Enter V.A.I.</span>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-center">Enter Provider's V.A.I. Number</h1>
          
          <Input
            placeholder="e.g., 9I7T35L"
            value={vaiNumber}
            onChange={(e) => setVaiNumber(e.target.value.toUpperCase())}
            className="h-14 text-lg text-center font-mono bg-white/10 border-white/20 text-white placeholder:text-white/40"
            maxLength={8}
          />

          <Button
            onClick={handleManualContinue}
            disabled={vaiNumber.length !== 8}
            className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            Continue
          </Button>
        </main>
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
          <h1 className="text-2xl font-bold">📷 Scan Provider's QR Code</h1>
        </div>

        <div className="relative aspect-square bg-black/20 rounded-lg overflow-hidden">
          <FaceScanner isActive={true} onStreamReady={() => {}} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-cyan-400 rounded-lg"></div>
          </div>
        </div>

        <p className="text-center text-white/80">
          Point camera at provider's QR code
        </p>

        <Button
          variant="ghost"
          onClick={() => setManualEntry(true)}
          className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
        >
          Or enter V.A.I. manually →
        </Button>
      </main>
    </div>
  );
}
