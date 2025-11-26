import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PendingMeeting {
  id: string;
  session_id: string;
  provider_id: string;
  client_id: string;
  status: string;
  accepted_at: string;
  metadata?: {
    requested_date?: string;
    requested_time?: string;
    duration_hours?: string;
  };
  other_party_name?: string;
  role: "provider" | "client";
}

export function PendingMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<PendingMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingMeetings();

    // Subscribe to changes
    const channel = supabase
      .channel("pending-meetings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "encounters",
        },
        () => {
          fetchPendingMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingMeetings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: encounters, error } = await supabase
        .from("encounters")
        .select(`
          *,
          vai_check_sessions (
            metadata
          )
        `)
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .eq("status", "vairidate_pending")
        .order("accepted_at", { ascending: false });

      if (error) throw error;

      // Fetch other party details
      const meetingsWithDetails = await Promise.all(
        (encounters || []).map(async (encounter) => {
          const isProvider = encounter.provider_id === user.id;
          const otherPartyId = isProvider ? encounter.client_id : encounter.provider_id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", otherPartyId)
            .single();

          return {
            ...encounter,
            metadata: (encounter as any).vai_check_sessions?.[0]?.metadata,
            other_party_name: profile?.full_name || "Unknown",
            role: isProvider ? "provider" : "client",
          } as PendingMeeting;
        })
      );

      setMeetings(meetingsWithDetails);
    } catch (error) {
      console.error("Error fetching pending meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No pending meetings
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="hover:bg-accent/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{meeting.other_party_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {meeting.role === "provider" ? "Client Request" : "Your Request"}
                  </Badge>
                </div>

                {meeting.metadata && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {meeting.metadata.requested_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(meeting.metadata.requested_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {meeting.metadata.requested_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{meeting.metadata.requested_time}</span>
                        {meeting.metadata.duration_hours && (
                          <span>({meeting.metadata.duration_hours}h)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => navigate(`/vai-check/session/${meeting.session_id}`)}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
