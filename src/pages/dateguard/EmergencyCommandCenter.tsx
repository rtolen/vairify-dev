import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Shield, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmergencyCommandCenter() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchData();
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const fetchData = async () => {
    try {
      // Fetch session
      const { data: sessionData } = await supabase
        .from("dateguard_sessions")
        .select(`
          *,
          user:profiles!dateguard_sessions_user_id_fkey(full_name, vai_number)
        `)
        .eq("id", sessionId)
        .single();

      setSession(sessionData);

      // Fetch ECC messages
      const { data: messagesData } = await supabase
        .from("emergency_command_center_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      setMessages(messagesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSafe = async () => {
    if (!window.confirm("Mark this emergency as resolved?")) return;

    await supabase
      .from("dateguard_sessions")
      .update({ 
        status: "completed",
      })
      .eq("id", sessionId);

    toast.success("Emergency marked as resolved");
    navigate("/dateguard");
  };

  const handleCall911 = () => {
    window.location.href = "tel:911";
  };

  const handleCallPolice = () => {
    const police = session?.nearest_police;
    if (police?.phone) {
      window.location.href = `tel:${police.phone.replace(/\D/g, '')}`;
    } else {
      toast.error("Police phone number not available");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FF5722] text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FF5722] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <Button onClick={() => navigate("/dateguard")}>Return to DateGuard</Button>
        </div>
      </div>
    );
  }

  const police = session.nearest_police || {};
  const gps = session.gps_coordinates || {};
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${gps.lat || 0},${gps.lng || 0}`;

  return (
    <div className="min-h-screen bg-[#FF5722] text-white">
      <header className="p-4 flex items-center justify-between bg-[#FF5722]/90 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dateguard")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">🚨 EMERGENCY COMMAND CENTER</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
        {/* User Info */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold">Name:</span> {session.user?.full_name || "Unknown"}</p>
            <p><span className="font-semibold">VAI:</span> {session.user?.vai_number || "Not available"}</p>
            <p><span className="font-semibold">Meeting Time:</span> {
              new Date(session.started_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            } - {
              new Date(session.scheduled_end_at || session.ends_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            }</p>
            <p><span className="font-semibold">Triggered:</span> {
              session.ended_via === 'panic' ? 'Panic Button' :
              session.ended_via === 'decoy' ? 'Decoy Code' :
              session.ended_via === 'timer_expiration' ? 'Timer Expired' :
              'Unknown'
            }</p>
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{session.location_address || "Not available"}</p>
            <p className="text-sm text-white/80">
              GPS: {gps.lat ? `${gps.lat.toFixed(4)}°N, ${Math.abs(gps.lng || 0).toFixed(4)}°W` : "Not available"}
            </p>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline text-sm"
            >
              Open in Google Maps
            </a>
            {session.last_gps_update && (
              <p className="text-xs text-white/60">
                Last update: {new Date(session.last_gps_update).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pre-Meeting Intel */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Pre-Meeting Intel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.pre_activation_notes && (
              <div>
                <p className="font-semibold mb-1">Notes:</p>
                <p className="text-white/90">{session.pre_activation_notes}</p>
              </div>
            )}
            {session.pre_activation_photos && session.pre_activation_photos.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Photos:</p>
                <div className="grid grid-cols-2 gap-2">
                  {session.pre_activation_photos.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Intel photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nearest Police */}
        {police.name && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Nearest Police Station
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">{police.name}</p>
              <p className="text-white/90">{police.address}</p>
              <p className="text-white/90">{police.phone}</p>
              <p className="text-sm text-white/80">{police.distance} miles away</p>
              <Button
                onClick={handleCallPolice}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Police Station
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Partner Info */}
        {session.encounter_id && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Partner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">VAI: {session.partner_vai || "Not available"}</p>
              <p className="text-sm text-white/60 mt-1">View full profile in app</p>
            </CardContent>
          </Card>
        )}

        {/* GPS Updates */}
        {messages.filter(m => m.message_type === 'gps_update').length > 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                GPS Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {messages
                .filter(m => m.message_type === 'gps_update')
                .map((msg, index) => (
                  <div key={index} className="text-sm text-white/80 border-b border-white/10 pb-2">
                    <p>{msg.content}</p>
                    <p className="text-xs text-white/60">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleMarkSafe}
              className="h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-bold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark Safe
            </Button>
            <Button
              onClick={handleCall911}
              className="h-16 bg-red-600 hover:bg-red-700 text-white text-lg font-bold"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call 911
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

