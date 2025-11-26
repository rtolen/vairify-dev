import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumericKeypad } from "./NumericKeypad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DecoyCodeInputProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onEmergencyTriggered: () => void;
}

export const DecoyCodeInput = ({ sessionId, isOpen, onClose, onEmergencyTriggered }: DecoyCodeInputProps) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Hash function (same as in SetupCodes)
  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCodeComplete = async () => {
    if (code.length < 4) {
      toast.error("Code must be at least 4 digits");
      return;
    }

    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get user's decoy code hash
      const { data: codes } = await supabase
        .from("dateguard_codes")
        .select("decoy_code_hash")
        .eq("user_id", user.id)
        .single();

      if (!codes) {
        toast.error("Decoy code not set up");
        setCode("");
        return;
      }

      // Verify code
      const inputHash = await hashCode(code);
      if (inputHash !== codes.decoy_code_hash) {
        toast.error("Incorrect code");
        setCode("");
        return;
      }

      // Code is correct - trigger silent emergency
      const { error: alertError } = await supabase.functions.invoke('send-emergency-command-center-sms', {
        body: {
          session_id: sessionId,
          trigger_type: 'decoy_code',
        },
      });

      if (alertError) {
        console.error('Error triggering decoy emergency:', alertError);
        toast.error("Failed to trigger emergency");
        return;
      }

      // Update session
      await supabase
        .from("dateguard_sessions")
        .update({
          status: "emergency",
          ended_via: "decoy",
          emergency_command_center_activated: true,
        })
        .eq("id", sessionId);

      // Close dialog and show "ended" screen
      onClose();
      onEmergencyTriggered();

      // Don't show success toast - this is silent!
    } catch (error: any) {
      console.error("Error verifying decoy code:", error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setVerifying(false);
      setCode("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1B2B5E] border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Enter Code to End Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <p className="text-white/70 text-center">
            Enter your code to safely end DateGuard
          </p>
          <NumericKeypad
            value={code}
            onChange={setCode}
            maxLength={6}
            disabled={verifying}
          />
          <button
            onClick={handleCodeComplete}
            disabled={code.length < 4 || verifying}
            className="w-full h-12 bg-white text-[#1B2B5E] rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? "Verifying..." : "End Session"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


