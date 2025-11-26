import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function Declined() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
      <div className="text-center space-y-6 p-4 max-w-md">
        <XCircle className="w-24 h-24 text-red-400 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">❌ MEETING DECLINED</h1>
          <p className="text-white/80">
            The meeting has been declined
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-6 space-y-2 text-sm text-left">
          <p>• No encounter will be created</p>
          <p>• Neither party is notified of who declined</p>
          <p>• Your privacy is protected</p>
        </div>

        <Button
          onClick={() => navigate('/feed')}
          className="w-full h-14 text-lg bg-white/10 hover:bg-white/20 text-white"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
