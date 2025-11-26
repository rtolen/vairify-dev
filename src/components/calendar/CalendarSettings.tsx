import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("calendar_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("calendar_settings")
        .upsert({
          user_id: user.id,
          ...values,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-settings"] });
      toast({
        title: "Settings saved",
        description: "Your calendar settings have been updated.",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-96 w-full" />
      </Card>
    );
  }

  const defaultSettings = {
    advance_notice_hours: 24,
    max_advance_days: 90,
    allow_same_day_booking: false,
    buffer_time_minutes: 0,
    min_appointment_duration_minutes: 60,
    max_appointment_duration_minutes: 480,
    auto_confirm_appointments: false,
    cancellation_notice_hours: 24,
  };

  const currentSettings = settings || defaultSettings;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Calendar Settings</h2>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const values = {
            advance_notice_hours: parseInt(formData.get("advance_notice_hours") as string),
            max_advance_days: parseInt(formData.get("max_advance_days") as string),
            allow_same_day_booking: formData.get("allow_same_day_booking") === "on",
            buffer_time_minutes: parseInt(formData.get("buffer_time_minutes") as string),
            min_appointment_duration_minutes: parseInt(formData.get("min_appointment_duration_minutes") as string),
            max_appointment_duration_minutes: parseInt(formData.get("max_appointment_duration_minutes") as string),
            auto_confirm_appointments: formData.get("auto_confirm_appointments") === "on",
            cancellation_notice_hours: parseInt(formData.get("cancellation_notice_hours") as string),
          };
          saveSettings.mutate(values);
        }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="advance_notice_hours">Advance Notice Required (hours)</Label>
            <Input
              id="advance_notice_hours"
              name="advance_notice_hours"
              type="number"
              defaultValue={currentSettings.advance_notice_hours}
              min="0"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum time required before an appointment can be booked
            </p>
          </div>

          <div>
            <Label htmlFor="max_advance_days">Maximum Advance Booking (days)</Label>
            <Input
              id="max_advance_days"
              name="max_advance_days"
              type="number"
              defaultValue={currentSettings.max_advance_days}
              min="1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              How far in advance clients can book appointments
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow_same_day_booking">Allow Same-Day Booking</Label>
              <p className="text-sm text-muted-foreground">
                Let clients book appointments for today
              </p>
            </div>
            <Switch
              id="allow_same_day_booking"
              name="allow_same_day_booking"
              defaultChecked={currentSettings.allow_same_day_booking}
            />
          </div>

          <div>
            <Label htmlFor="buffer_time_minutes">Buffer Time Between Appointments (minutes)</Label>
            <Input
              id="buffer_time_minutes"
              name="buffer_time_minutes"
              type="number"
              defaultValue={currentSettings.buffer_time_minutes}
              min="0"
              step="15"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Gap automatically added between appointments
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_appointment_duration_minutes">Min Duration (minutes)</Label>
              <Input
                id="min_appointment_duration_minutes"
                name="min_appointment_duration_minutes"
                type="number"
                defaultValue={currentSettings.min_appointment_duration_minutes}
                min="15"
                step="15"
              />
            </div>
            <div>
              <Label htmlFor="max_appointment_duration_minutes">Max Duration (minutes)</Label>
              <Input
                id="max_appointment_duration_minutes"
                name="max_appointment_duration_minutes"
                type="number"
                defaultValue={currentSettings.max_appointment_duration_minutes}
                min="15"
                step="15"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_confirm_appointments">Auto-Confirm Appointments</Label>
              <p className="text-sm text-muted-foreground">
                Automatically confirm bookings without manual approval
              </p>
            </div>
            <Switch
              id="auto_confirm_appointments"
              name="auto_confirm_appointments"
              defaultChecked={currentSettings.auto_confirm_appointments}
            />
          </div>

          <div>
            <Label htmlFor="cancellation_notice_hours">Cancellation Notice (hours)</Label>
            <Input
              id="cancellation_notice_hours"
              name="cancellation_notice_hours"
              type="number"
              defaultValue={currentSettings.cancellation_notice_hours}
              min="0"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum notice required for cancellations
            </p>
          </div>
        </div>

        <Button type="submit" disabled={saveSettings.isPending}>
          Save Settings
        </Button>
      </form>
    </Card>
  );
}
