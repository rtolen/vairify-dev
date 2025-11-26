import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, AlertTriangle, Camera, CheckCircle2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NumberPad from "@/components/dateguard/NumberPad";
import FaceScanner from "@/components/dateguard/FaceScanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Step = "face-verify" | "intro" | "deactivation" | "decoy" | "final";

export default function SafetyCodesSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("face-verify");
  const [deactivationCode, setDeactivationCode] = useState("");
  const [decoyCode, setDecoyCode] = useState("");
  const [existingCodes, setExistingCodes] = useState<{ deactivation: string; decoy: string } | null>(null);
  const [editingCode, setEditingCode] = useState<"deactivation" | "decoy" | null>(null);

  useEffect(() => {
    checkExistingCodes();
  }, []);

  const checkExistingCodes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("safety_codes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && !error) {
      setExistingCodes({
        deactivation: data.deactivation_code,
        decoy: data.decoy_code
      });
    }
  };

  const handleFaceVerified = () => {
    if (existingCodes) {
      setStep("final");
    } else {
      setStep("intro");
    }
  };

  const handleBack = () => {
    if (step === "face-verify") {
      navigate("/dateguard");
    } else if (step === "intro") {
      setStep("face-verify");
    } else if (step === "deactivation") {
      setStep("intro");
    } else if (step === "decoy") {
      setStep("deactivation");
    } else if (step === "final") {
      navigate("/dateguard");
    }
  };

  const handleContinue = async () => {
    if (step === "intro") {
      setStep("deactivation");
    } else if (step === "deactivation" && deactivationCode.length === 3) {
      setStep("decoy");
    } else if (step === "decoy" && decoyCode.length === 3 && decoyCode !== deactivationCode) {
      await saveCodes();
    } else if (step === "final" && editingCode) {
      await updateCode();
    }
  };

  const saveCodes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("safety_codes")
      .insert({
        user_id: user.id,
        deactivation_code: deactivationCode,
        decoy_code: decoyCode
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save codes. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setExistingCodes({
      deactivation: deactivationCode,
      decoy: decoyCode
    });
    setStep("final");
    toast({
      title: "Success",
      description: "Safety codes saved successfully"
    });
  };

  const updateCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !editingCode) return;

    const updateData = editingCode === "deactivation" 
      ? { deactivation_code: deactivationCode }
      : { decoy_code: decoyCode };

    const { error } = await supabase
      .from("safety_codes")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update code. Please try again.",
        variant: "destructive"
      });
      return;
    }

    await checkExistingCodes();
    setEditingCode(null);
    setDeactivationCode("");
    setDecoyCode("");
    toast({
      title: "Success",
      description: "Code updated successfully"
    });
  };

  const startEditCode = (codeType: "deactivation" | "decoy") => {
    setEditingCode(codeType);
    setStep("face-verify");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(265,70%,20%)] to-[hsl(270,60%,30%)] text-white">
      {/* Header */}
      <header className="p-4 flex items-center border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="ml-3 text-lg font-semibold">
          {step === "face-verify" ? "Face Verification" : "SAFETY CODES"}
        </h1>
      </header>

      {/* Face Verification First */}
      {step === "face-verify" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Verify It's You</h2>
              <p className="text-white/80 max-w-sm">
                {editingCode 
                  ? "Facial verification required to edit codes" 
                  : existingCodes 
                    ? "Facial verification required to view codes"
                    : "Facial verification required to set codes"}
              </p>
            </div>

            <FaceScanner 
              isActive={true}
              onStreamReady={() => {}}
            />
          </div>

          <div className="p-4">
            <div className="space-y-3">
              <Button 
                onClick={handleFaceVerified}
                className="w-full h-14 text-lg"
              >
                Verify & Continue
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Intro Screen */}
      {step === "intro" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-8">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
              <Lock className="w-12 h-12 text-white" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Setup Safety Codes</h2>
              <p className="text-white/80 max-w-sm">
                Safety codes let your guardians verify you're safe during emergencies.
              </p>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-lg p-6 max-w-sm space-y-4">
              <p className="text-sm text-white/90">You'll create:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Deactivation Code (real)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Decoy Code (alert)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-lg p-6 max-w-sm space-y-3">
              <h3 className="font-semibold text-sm">HOW IT WORKS:</h3>
              <p className="text-sm text-white/80">If guardian asks for your code:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                  <span>Give DEACTIVATION code = You're safe</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  <span>Give DECOY code = Silent alert</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4">
            <Button 
              onClick={handleContinue}
              className="w-full h-14 text-lg"
            >
              Start Setup
            </Button>
          </div>
        </>
      )}

      {/* Deactivation Code */}
      {step === "deactivation" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Set Deactivation Code</h2>
              <p className="text-white/80">Enter a 3-digit code</p>
            </div>

            <NumberPad 
              value={deactivationCode}
              onChange={setDeactivationCode}
              maxLength={3}
            />

            <Card className="bg-white/5 border-white/20 max-w-sm">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-white">What is the Deactivation Code?</h3>
                <p className="text-sm text-white/80">
                  This is your <strong>real safety code</strong>. When guardians ask for your code and you give them this one, it confirms you're safe and everything is okay.
                </p>
              </CardContent>
            </Card>

            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-w-sm">
              <p className="text-sm text-white/80">
                💡 Choose something memorable but not obvious
              </p>
            </div>
          </div>

          <div className="p-4">
            <Button 
              onClick={handleContinue}
              disabled={deactivationCode.length !== 3}
              className="w-full h-14 text-lg"
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {/* Decoy Code */}
      {step === "decoy" && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Set Decoy Code</h2>
              <p className="text-white/80">Enter a DIFFERENT 3-digit code</p>
            </div>

            <NumberPad 
              value={decoyCode}
              onChange={setDecoyCode}
              maxLength={3}
            />

            <Card className="bg-white/5 border-white/20 max-w-sm">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm text-white">What is the Decoy Code?</h3>
                <p className="text-sm text-white/80">
                  This is your <strong>emergency alert code</strong>. If you're in danger and give this code to guardians, it will silently alert them that you need help without the other person knowing.
                </p>
              </CardContent>
            </Card>

            <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4 max-w-sm space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-sm">WARNING</h3>
              </div>
              <p className="text-sm text-white/90">
                Giving this code triggers a SILENT ALERT to all guardians without the other person knowing.
              </p>
            </div>
          </div>

          <div className="p-4">
            <Button 
              onClick={handleContinue}
              disabled={decoyCode.length !== 3 || decoyCode === deactivationCode}
              className="w-full h-14 text-lg"
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {/* Final Screen - View Both Codes */}
      {step === "final" && existingCodes && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 space-y-8">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-primary">Codes Active</h2>
              <p className="text-white/80 max-w-sm">
                Your safety codes are set and ready
              </p>
            </div>

            <div className="space-y-4 w-full max-w-sm">
              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Deactivation Code</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditCode("deactivation")}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-mono text-white">•••</p>
                  <p className="text-xs text-white/50 mt-2">Real safety code - confirms you're safe</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/60">Decoy Code</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditCode("decoy")}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-mono text-white">•••</p>
                  <p className="text-xs text-destructive/70 mt-2">Emergency code - silent alert</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-w-sm">
              <p className="text-sm text-white/80">
                💡 <strong>TIP:</strong> Tap the edit icon to update either code with facial verification.
              </p>
            </div>
          </div>

          <div className="p-4">
            <Button 
              onClick={() => navigate("/dateguard")}
              className="w-full h-14 text-lg"
            >
              Done
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
