import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, MapPin, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function GuardianChat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
    fetchSession();
    fetchMessages();
    subscribeToMessages();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchSession = async () => {
    const { data } = await supabase
      .from("dateguard_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    setSession(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("dateguard_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    
    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dateguard_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    await supabase.from("dateguard_messages").insert({
      session_id: sessionId,
      sender_id: user.id,
      sender_type: "user",
      sender_name: user.email?.split("@")[0] || "User",
      message_type: "text",
      message: newMessage,
    });

    setNewMessage("");
  };

  const renderMessage = (msg: any) => {
    if (msg.message_type === "session_start") {
      return (
        <Card className="bg-gradient-to-r from-[hsl(16,100%,60%)] to-[hsl(32,98%,55%)] border-0 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <p className="font-bold text-white">VAIRIFY BOT</p>
                <p className="text-xs text-white/80">Just now</p>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 space-y-3 text-white">
              <p className="font-bold text-lg">🛡️ DateGuard Session Started</p>
              
              <div className="space-y-2 text-sm">
                <p><strong>Provider:</strong> {user?.email} ✅</p>
                <p><strong>Duration:</strong> {session?.duration_minutes} minutes</p>
                
                <div className="border-t border-white/20 pt-2 mt-2">
                  <p className="font-bold">📍 LOCATION:</p>
                  <p>{session?.location_name}</p>
                  <p className="text-xs text-white/80">{session?.location_address}</p>
                  <p className="text-xs text-white/80">GPS: {session?.location_gps}</p>
                </div>

                <Button variant="outline" size="sm" className="w-full text-white border-white/30 hover:bg-white/20 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  VIEW LIVE MAP
                </Button>

                <div className="border-t border-white/20 pt-2 mt-2">
                  <p className="font-bold">📝 MEMO:</p>
                  <p className="text-white/90">{session?.memo}</p>
                </div>

                <div className="border-t border-white/20 pt-2 mt-2">
                  <p className="font-bold">🚔 NEAREST POLICE:</p>
                  <p>Atlanta Police Zone 5</p>
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" />
                    (404) 624-0674
                  </p>
                  <p className="text-xs text-white/80">📍 0.8 miles (3-5 min)</p>
                  <p className="text-xs text-white/80">2645 Campbellton Rd SW</p>
                  
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      📞 CALL POLICE
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-white border-white/30 hover:bg-white/20">
                      📍 DIRECTIONS
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (msg.message_type === "emergency") {
      return (
        <Card className="bg-red-600 border-0 shadow-lg animate-pulse">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-white" />
              <div>
                <p className="font-bold text-white">VAIRIFY BOT</p>
                <p className="text-xs text-white/80">Just now</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-white">
              <p className="font-bold text-lg">🚨 EMERGENCY ACTIVATED</p>
              <p className="text-sm mt-2">Immediate action required!</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (msg.sender_type === "bot") {
      return (
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤖</span>
            <p className="text-xs text-white/70">VAIRIFY BOT</p>
          </div>
          <p className="text-sm text-white">{msg.message}</p>
        </div>
      );
    }

    return (
      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            👤
          </div>
          <p className="text-xs text-white/70">{msg.sender_name}</p>
          <p className="text-xs text-white/50 ml-auto">{new Date(msg.created_at).toLocaleTimeString()}</p>
        </div>
        <p className="text-sm text-white">{msg.message}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(16,100%,60%)] to-[hsl(32,98%,55%)] flex flex-col">
      <header className="p-4 flex items-center gap-3 bg-[hsl(16,100%,55%)]/80 backdrop-blur-md sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/dateguard/session/${sessionId}`)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">🛡️ DATEGUARD ACTIVE</h1>
          <p className="text-xs text-white/80">Sarah K. - Atlanta Group</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div key={msg.id}>{renderMessage(msg)}</div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[hsl(16,100%,55%)]/95 backdrop-blur-md border-t border-white/20">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type message..."
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
          <Button onClick={sendMessage} className="bg-white text-[hsl(16,100%,60%)] hover:bg-white/90">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
