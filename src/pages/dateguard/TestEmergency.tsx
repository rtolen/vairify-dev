import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TestEmergency() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("60");

  const createTestSession = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + parseInt(durationMinutes) * 60000);

      const { data: session, error } = await supabase
        .from("dateguard_sessions")
        .insert({
          user_id: user.id,
          location_name: "Test Location - Starbucks Downtown",
          location_address: "123 Main St, Atlanta, GA 30303",
          location_gps: "33.7490,-84.3880",
          memo: "Testing emergency mode",
          duration_minutes: parseInt(durationMinutes),
          started_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial bot message
      await supabase.from("dateguard_messages").insert({
        session_id: session.id,
        sender_type: "bot",
        sender_name: "VAIRIFY BOT",
        message_type: "session_start",
        message: `🛡️ DateGuard session started\n📍 ${session.location_name}\n⏱️ ${durationMinutes} minutes`,
        metadata: {
          location: session.location_address,
          duration: durationMinutes,
        },
      });

      toast({
        title: "✅ Test Session Created",
        description: "Navigating to active session...",
      });

      setTimeout(() => {
        navigate(`/dateguard/session/${session.id}`);
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(265,70%,20%)] to-[hsl(270,60%,30%)] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dateguard")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">🧪 Test Emergency Mode</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <Card className="bg-amber-500/20 border-amber-500/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/90">
                <p className="font-semibold text-white mb-1">Testing Mode</p>
                <p>This creates a test DateGuard session so you can test emergency features without affecting real data.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Create Test Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white">
                Session Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                max="480"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-white/60">
                Tip: Use 1-5 minutes for quick testing
              </p>
            </div>

            <Button
              onClick={createTestSession}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-[hsl(188,95%,43%)] to-[hsl(188,95%,53%)] hover:shadow-lg hover:shadow-cyan-500/50"
            >
              {isCreating ? "Creating Session..." : "START TEST SESSION"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-sm">How to Test Emergency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <div className="flex gap-3">
              <span className="flex-shrink-0 font-bold">1.</span>
              <p>Create a test session above</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 font-bold">2.</span>
              <p>You'll be taken to the Active Session page</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 font-bold">3.</span>
              <p>Click the red "PANIC 🚨" button to trigger emergency mode</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 font-bold">4.</span>
              <p>Check the Guardian Chat to see emergency messages</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
