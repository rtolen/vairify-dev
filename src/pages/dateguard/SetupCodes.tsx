import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericKeypad } from "@/components/dateguard/NumericKeypad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

export default function SetupCodes() {
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const [step, setStep] = useState<"disarm" | "confirm-disarm" | "decoy" | "confirm-decoy">("disarm");
  const [disarmCode, setDisarmCode] = useState("");
  const [disarmCodeConfirm, setDisarmCodeConfirm] = useState("");
  const [decoyCode, setDecoyCode] = useState("");
  const [decoyCodeConfirm, setDecoyCodeConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // Simple hash function (in production, use bcrypt or similar)
  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleDisarmCodeComplete = () => {
    if (disarmCode.length < 4) {
      toast.error("Code must be at least 4 digits");
      return;
    }
    setStep("confirm-disarm");
    setDisarmCodeConfirm("");
  };

  const handleDisarmCodeConfirm = () => {
    if (disarmCode !== disarmCodeConfirm) {
      toast.error("Codes don't match. Please try again.");
      setDisarmCodeConfirm("");
      return;
    }
    setStep("decoy");
    setDecoyCode("");
  };

  const handleDecoyCodeComplete = () => {
    if (decoyCode.length < 4) {
      toast.error("Code must be at least 4 digits");
      return;
    }
    if (decoyCode === disarmCode) {
      toast.error("Decoy code must be different from disarm code");
      setDecoyCode("");
      return;
    }
    setStep("confirm-decoy");
    setDecoyCodeConfirm("");
  };

  const handleDecoyCodeConfirm = async () => {
    if (decoyCode !== decoyCodeConfirm) {
      toast.error("Codes don't match. Please try again.");
      setDecoyCodeConfirm("");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user VAI
      const { data: profile } = await supabase
        .from("profiles")
        .select("vai_number")
        .eq("id", user.id)
        .single();

      const disarmHash = await hashCode(disarmCode);
      const decoyHash = await hashCode(decoyCode);

      // Upsert codes
      const { error } = await supabase
        .from("dateguard_codes")
        .upsert({
          user_id: user.id,
          user_vai: profile?.vai_number || null,
          disarm_code_hash: disarmHash,
          decoy_code_hash: decoyHash,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Codes saved successfully!");
      navigate("/dateguard/setup/groups");
    } catch (error: any) {
      console.error("Error saving codes:", error);
      toast.error(error.message || "Failed to save codes");
    } finally {
      setSaving(false);
    }
  };

  // Disarm Code Setup
  if (step === "disarm") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dateguard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Set Disarm Code</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Shield className="w-16 h-16 mx-auto text-white/80" />
            <p className="text-white/90 text-lg">Enter 4-6 digit code</p>
            <p className="text-white/60 text-sm">This code turns off DateGuard safely</p>
          </div>

          <NumericKeypad
            value={disarmCode}
            onChange={setDisarmCode}
            maxLength={6}
          />

          <Button
            onClick={handleDisarmCodeComplete}
            disabled={disarmCode.length < 4}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue
          </Button>
        </main>
      </div>
    );
  }

  // Confirm Disarm Code
  if (step === "confirm-disarm") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("disarm")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Confirm Disarm Code</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Shield className="w-16 h-16 mx-auto text-white/80" />
            <p className="text-white/90 text-lg">Re-enter your code</p>
          </div>

          <NumericKeypad
            value={disarmCodeConfirm}
            onChange={setDisarmCodeConfirm}
            maxLength={6}
          />

          <Button
            onClick={handleDisarmCodeConfirm}
            disabled={disarmCodeConfirm.length !== disarmCode.length}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Confirm
          </Button>
        </main>
      </div>
    );
  }

  // Decoy Code Setup
  if (step === "decoy") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("confirm-disarm")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Set Decoy Code</h1>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <AlertTriangle className="w-16 h-16 mx-auto text-white/80" />
            <p className="text-white/90 text-lg">Enter different 4-6 digit code</p>
            <p className="text-white/60 text-sm">This code silently alerts guardians while appearing normal</p>
          </div>

          <NumericKeypad
            value={decoyCode}
            onChange={setDecoyCode}
            maxLength={6}
          />

          <Button
            onClick={handleDecoyCodeComplete}
            disabled={decoyCode.length < 4}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue
          </Button>
        </main>
      </div>
    );
  }

  // Confirm Decoy Code
  return (
    <div className="min-h-screen bg-[#1B2B5E] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep("decoy")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Confirm Decoy Code</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-16 h-16 mx-auto text-white/80" />
          <p className="text-white/90 text-lg">Re-enter your decoy code</p>
        </div>

        <NumericKeypad
          value={decoyCodeConfirm}
          onChange={setDecoyCodeConfirm}
          maxLength={6}
        />

        <Button
          onClick={handleDecoyCodeConfirm}
          disabled={decoyCodeConfirm.length !== decoyCode.length || saving}
          className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
        >
          {saving ? "Saving..." : "Save Codes"}
        </Button>
      </main>
    </div>
  );
}


