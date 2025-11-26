import { useNavigate } from "react-router-dom";
import { Shield, Users, Play, Hash, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PendingMeetings } from "@/components/vairidate/PendingMeetings";

export default function DateGuardHome() {
  const navigate = useNavigate();
  const [hasCodesSet, setHasCodesSet] = useState(false);
  const [guardiansStatus, setGuardiansStatus] = useState<{
    active: number;
    pending: number;
    setupComplete: boolean;
  }>({ active: 0, pending: 0, setupComplete: false });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check safety codes (new dateguard_codes table)
    const { data: codesData } = await supabase
      .from("dateguard_codes")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    setHasCodesSet(!!codesData);

    // Check guardians
    const { data: guardiansData } = await supabase
      .from("guardians")
      .select("status")
      .eq("user_id", user.id);

    const active = guardiansData?.filter(g => g.status === "active").length || 0;
    const pending = guardiansData?.filter(g => g.status === "pending").length || 0;

    setGuardiansStatus({
      active,
      pending,
      setupComplete: active > 0
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(265,70%,20%)] to-[hsl(270,60%,30%)] text-white">
      {/* Header */}
      <header className="p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/feed")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 space-y-8 max-w-md mx-auto">
        {/* Shield Icon - Animated */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center border-2 border-white/30">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Date Guard</h1>
        </div>

        {/* Pending Meetings - Active Panel */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Active Pending Meetings</h2>
          <PendingMeetings />
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* My Guardians */}
          <Card 
            className={`border-white/20 hover:bg-white/15 transition-all cursor-pointer backdrop-blur-sm ${
              guardiansStatus.setupComplete 
                ? "bg-white/10" 
                : "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-amber-500/30"
            }`}
            onClick={() => navigate("/dateguard/guardians")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  guardiansStatus.setupComplete ? "bg-white/20" : "bg-amber-500/30"
                }`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    My Guardians
                    {guardiansStatus.setupComplete && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </h3>
                  <p className="text-sm text-white/70">
                    {guardiansStatus.active === 0 && guardiansStatus.pending === 0 
                      ? "No guardians added"
                      : `${guardiansStatus.active} active${guardiansStatus.pending > 0 ? ` • ${guardiansStatus.pending} pending` : ""}`
                    }
                  </p>
                </div>
                {guardiansStatus.setupComplete ? (
                  <div className="text-xs text-green-400 font-medium">Setup Complete</div>
                ) : (
                  <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Setup Required
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activate */}
          <Card 
            className="bg-gradient-to-r from-[hsl(188,95%,43%)] to-[hsl(188,95%,53%)] border-0 hover:shadow-lg hover:shadow-cyan-500/50 transition-all cursor-pointer"
            onClick={() => navigate("/dateguard/activate")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white">Activate</h3>
                <p className="text-sm text-white/90">Start protection now</p>
              </div>
            </CardContent>
          </Card>

          {/* Test Emergency (Development) */}
          <Card 
            className="bg-amber-500/20 border-amber-500/30 backdrop-blur-sm hover:bg-amber-500/30 transition-all cursor-pointer"
            onClick={() => navigate("/dateguard/test-emergency")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">🧪 Test Emergency</h3>
                <p className="text-xs text-white/70">Quick test session</p>
              </div>
            </CardContent>
          </Card>

          {/* Safety Codes */}
          <Card 
            className={`border-white/20 hover:bg-white/15 transition-all cursor-pointer backdrop-blur-sm ${
              hasCodesSet 
                ? "bg-white/10" 
                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
            }`}
                onClick={() => navigate("/dateguard/setup/codes")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasCodesSet ? "bg-white/20" : "bg-amber-500/30"
              }`}>
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white">
                  {hasCodesSet ? "Edit Codes" : "Set Up Codes"}
                </h3>
                <p className="text-sm text-white/70">
                  {hasCodesSet ? "Deactivation & decoy codes" : "Create your safety codes"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
