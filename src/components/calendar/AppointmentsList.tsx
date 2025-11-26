import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentsList() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          provider:provider_id(full_name, avatar_url),
          client:client_id(full_name, avatar_url)
        `)
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .gte("start_time", new Date().toISOString())
        .order("start_time");

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!appointments?.length) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Upcoming Appointments</h3>
        <p className="text-muted-foreground">
          You don't have any scheduled appointments yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {apt.appointment_type || "Appointment"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {/* @ts-ignore */}
                  with {apt.provider?.full_name || apt.client?.full_name}
                </p>
              </div>
            </div>
            <Badge
              variant={
                apt.status === "confirmed" ? "default" :
                apt.status === "pending" ? "secondary" :
                "destructive"
              }
            >
              {apt.status}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(apt.start_time), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(apt.start_time), "h:mm a")} - 
                {format(new Date(apt.end_time), "h:mm a")}
              </span>
            </div>
            {apt.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{apt.location}</span>
              </div>
            )}
          </div>

          {apt.notes && (
            <p className="text-sm text-muted-foreground mb-4">
              {apt.notes}
            </p>
          )}

          <div className="flex gap-2">
            {apt.status === "pending" && (
              <>
                <Button variant="default" size="sm">
                  Confirm
                </Button>
                <Button variant="outline" size="sm">
                  Reschedule
                </Button>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </>
            )}
            {apt.status === "confirmed" && (
              <Button variant="outline" size="sm">
                View Details
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
