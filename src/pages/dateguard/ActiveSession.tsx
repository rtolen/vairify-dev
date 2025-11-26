import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, X, Settings, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DecoyCodeInput } from "@/components/dateguard/DecoyCodeInput";

export default function ActiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [panicHoldProgress, setPanicHoldProgress] = useState(0);
  const [isHoldingPanic, setIsHoldingPanic] = useState(false);
  const panicHoldInterval = useRef<NodeJS.Timeout | null>(null);
  const [showDecoyInput, setShowDecoyInput] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const gpsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      const timerInterval = setInterval(updateTimer, 1000);
      return () => {
        clearInterval(timerInterval);
        if (panicHoldInterval.current) clearInterval(panicHoldInterval.current);
        if (gpsInterval.current) clearInterval(gpsInterval.current);
      };
    }
  }, [sessionId]);

  useEffect(() => {
    // Start GPS tracking every 2 minutes
    if (session?.gps_tracking_enabled && session?.status === 'active') {
      updateGPS();
      gpsInterval.current = setInterval(updateGPS, 2 * 60 * 1000); // Every 2 minutes
      return () => {
        if (gpsInterval.current) clearInterval(gpsInterval.current);
      };
    }
  }, [session]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from("dateguard_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    setSession(data);
    if (data?.status === 'emergency') {
      setEmergencyTriggered(true);
    }
  };

  const updateTimer = () => {
    if (!session) return;

    const now = new Date().getTime();
    const end = new Date(session.scheduled_end_at || session.ends_at).getTime();
    const diff = end - now;

    if (diff <= 0) {
      setHours(0);
      setMinutes(0);
      setTotalMinutes(0);
      
      // Timer expired - trigger emergency after buffer
      if (session.status === 'active' && !timerExpired) {
        setTimerExpired(true);
        handleTimerExpired();
      }
      return;
    }

    const totalMins = Math.floor(diff / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    setHours(hrs);
    setMinutes(mins);
    setTotalMinutes(totalMins);
  };

  const updateGPS = async () => {
    if (!sessionId) return;

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await supabase.functions.invoke('update-gps-tracking', {
              body: {
                session_id: sessionId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            });
          },
          (error) => {
            console.warn('GPS update failed:', error);
          }
        );
      }
    } catch (error) {
      console.error('Error updating GPS:', error);
    }
  };

  const handleTimerExpired = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Wait for buffer period
      const bufferMs = (session.buffer_minutes || 0) * 60 * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(bufferMs, 30000))); // Max 30s wait

      // Update session status
      await supabase
        .from("dateguard_sessions")
        .update({ 
          status: "emergency",
          ended_via: "timer_expiration",
        })
        .eq("id", sessionId);

      // Trigger Emergency Command Center
      const { error: alertError } = await supabase.functions.invoke('send-emergency-command-center-sms', {
        body: {
          session_id: sessionId,
          trigger_type: 'timer_expired',
        },
      });

      if (alertError) {
        console.error('Error triggering ECC:', alertError);
        toast.error("Emergency alert triggered but notification failed");
      } else {
        toast.error("⏰ Timer expired - Emergency Command Center activated");
      }

      setEmergencyTriggered(true);
      navigate(`/dateguard/emergency/${sessionId}`);
    } catch (error) {
      console.error('Error handling timer expiration:', error);
    }
  };

  const handleSafeButton = async () => {
    await supabase
      .from("dateguard_sessions")
      .update({ last_checkin_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Reset timer by extending end time
    const newEndTime = new Date(Date.now() + 30 * 60 * 1000); // Add 30 minutes
    await supabase
      .from("dateguard_sessions")
      .update({ 
        scheduled_end_at: newEndTime.toISOString(),
        ends_at: newEndTime.toISOString(),
      })
      .eq("id", sessionId);

    await supabase.from("dateguard_messages").insert({
      session_id: sessionId,
      sender_type: "bot",
      sender_name: "VAIRIFY BOT",
      message_type: "checkin",
      message: "✅ Check-in confirmed - Timer reset",
    });

    toast.success("✅ Check-in confirmed! Timer reset.");
    fetchSession(); // Refresh session data
  };

  const handleExtend = async () => {
    const newEndTime = new Date(Date.now() + 30 * 60 * 1000); // Add 30 minutes
    await supabase
      .from("dateguard_sessions")
      .update({ 
        scheduled_end_at: newEndTime.toISOString(),
        ends_at: newEndTime.toISOString(),
      })
      .eq("id", sessionId);

    toast.success("Time extended by 30 minutes");
    fetchSession();
  };

  const handleEndEarly = async () => {
    if (!window.confirm("Are you sure you want to end DateGuard early?")) return;

    await supabase
      .from("dateguard_sessions")
      .update({ 
        status: "completed",
        ended_via: "normal",
      })
      .eq("id", sessionId);

    toast.success("DateGuard ended safely");
    navigate("/dateguard");
  };

  const startPanicHold = () => {
    setIsHoldingPanic(true);
    setPanicHoldProgress(0);
    
    panicHoldInterval.current = setInterval(() => {
      setPanicHoldProgress((prev) => {
        if (prev >= 100) {
          if (panicHoldInterval.current) clearInterval(panicHoldInterval.current);
          handlePanicButton();
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 * 100ms
      });
    }, 100);
  };

  const stopPanicHold = () => {
    setIsHoldingPanic(false);
    if (panicHoldInterval.current) {
      clearInterval(panicHoldInterval.current);
      panicHoldInterval.current = null;
    }
    setPanicHoldProgress(0);
  };

  const handlePanicButton = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

      // Update session
      await supabase
        .from("dateguard_sessions")
        .update({ 
          status: "emergency",
          ended_via: "panic",
        })
        .eq("id", sessionId);

      // Trigger Emergency Command Center
      const { error: alertError } = await supabase.functions.invoke('send-emergency-command-center-sms', {
        body: {
          session_id: sessionId,
          trigger_type: 'panic_button',
        },
      });

      if (alertError) {
        console.error('Error triggering ECC:', alertError);
        toast.error("Emergency triggered but notification failed");
      } else {
        toast.error("🚨 PANIC BUTTON - Emergency Command Center activated");
      }

      setEmergencyTriggered(true);
      navigate(`/dateguard/emergency/${sessionId}`);
    } catch (error) {
      console.error('Error handling panic:', error);
      toast.error("Failed to trigger emergency");
    }
  };

  const handleDecoyEmergency = () => {
    setEmergencyTriggered(true);
    // Show "ended" screen but emergency is active
    navigate("/dateguard");
  };

  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (totalMinutes > 30) return "text-green-400";
    if (totalMinutes > 10) return "text-yellow-400";
    return "text-red-400";
  };

  // Determine background color (emergency mode = orange/red)
  const getBackgroundColor = () => {
    if (emergencyTriggered || session?.status === 'emergency') {
      return "bg-[#FF5722]"; // Bright orange/red
    }
    return "bg-[#1B2B5E]"; // Dark purple
  };

  if (!session) {
    return (
      <div className={`min-h-screen ${getBackgroundColor()} flex items-center justify-center`}>
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Emergency ended screen (for decoy code)
  if (emergencyTriggered && session.ended_via === 'decoy') {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <CheckCircle className="w-20 h-20 mx-auto text-green-400" />
          <h1 className="text-3xl font-bold">DateGuard Ended</h1>
          <p className="text-white/70">Your session has been safely concluded.</p>
          <Button
            onClick={() => navigate("/dateguard")}
            className="bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Return to DateGuard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getBackgroundColor()} text-white pb-24 transition-colors duration-500`}>
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dateguard")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">🛡️ DATEGUARD ACTIVE</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDecoyInput(true)}
          className="text-white hover:bg-white/10"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      <main className="px-4 py-8 space-y-8 max-w-md mx-auto">
        {/* Huge Countdown Timer */}
        <div className="text-center space-y-4">
          <div className={`text-8xl font-bold ${getTimerColor()} transition-colors duration-500`}>
            {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}
          </div>
          <p className="text-white/70 text-lg">Time remaining</p>
        </div>

        {/* Three Large Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleSafeButton}
            className="w-full h-20 text-xl font-bold bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle className="w-6 h-6 mr-2" />
            I'm OK
          </Button>

          <Button
            onClick={handleExtend}
            className="w-full h-20 text-xl font-bold bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Clock className="w-6 h-6 mr-2" />
            Extend
          </Button>

          <Button
            onClick={handleEndEarly}
            className="w-full h-20 text-xl font-bold bg-gray-500 hover:bg-gray-600 text-white"
          >
            <X className="w-6 h-6 mr-2" />
            End Early
          </Button>
        </div>

        {/* Panic Button - Always Visible */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <button
            onMouseDown={startPanicHold}
            onMouseUp={stopPanicHold}
            onMouseLeave={stopPanicHold}
            onTouchStart={startPanicHold}
            onTouchEnd={stopPanicHold}
            className={`w-full h-20 rounded-full font-bold text-xl text-white transition-all ${
              isHoldingPanic ? "bg-red-700 scale-95" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isHoldingPanic ? (
              <div className="space-y-2">
                <div className="w-full bg-red-800 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-100"
                    style={{ width: `${panicHoldProgress}%` }}
                  />
                </div>
                <span>HOLD ({Math.round(panicHoldProgress / 3.33)}s)</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <AlertOctagon className="w-6 h-6" />
                <span>PANIC (Hold 3s)</span>
              </div>
            )}
          </button>
        </div>
      </main>

      {/* Decoy Code Input Dialog */}
      <DecoyCodeInput
        sessionId={sessionId!}
        isOpen={showDecoyInput}
        onClose={() => setShowDecoyInput(false)}
        onEmergencyTriggered={handleDecoyEmergency}
      />
    </div>
  );
}
