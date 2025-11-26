import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Loader2, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleTemplates } from "./ScheduleTemplates";

interface ScheduleSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  timezone: string;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      slots.push(`${h}:${m}:00`);
    }
  }
  return slots;
};

const formatTime = (time: string) => {
  const [hour, min] = time.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${min} ${ampm}`;
};

export const AvailabilitySchedule = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [defaultTimezone, setDefaultTimezone] = useState("America/New_York");
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleSlot>>({
    day_of_week: 1,
    start_time: "09:00:00",
    end_time: "17:00:00",
    is_enabled: true,
    timezone: "America/New_York",
  });

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("provider_profiles")
        .select("auto_availability_enabled")
        .eq("user_id", user.id)
        .single();

      setAutoEnabled(profile?.auto_availability_enabled || false);

      const { data, error } = await supabase
        .from("provider_availability_schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;

      const loadedSchedules = data || [];
      setSchedules(loadedSchedules);
      
      if (loadedSchedules.length > 0) {
        setDefaultTimezone(loadedSchedules[0].timezone);
        setNewSchedule(prev => ({ ...prev, timezone: loadedSchedules[0].timezone }));
      } else {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matchingTimezone = TIMEZONES.find(tz => tz.value === userTimezone);
        if (matchingTimezone) {
          setDefaultTimezone(matchingTimezone.value);
          setNewSchedule(prev => ({ ...prev, timezone: matchingTimezone.value }));
        }
      }
    } catch (error: any) {
      console.error("Error loading schedules:", error);
      toast.error(error.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoToggle = async (enabled: boolean) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("provider_profiles")
        .update({ auto_availability_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setAutoEnabled(enabled);
      toast.success(enabled ? "Auto-availability enabled" : "Auto-availability disabled");
    } catch (error: any) {
      console.error("Error toggling auto-availability:", error);
      toast.error(error.message || "Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.day_of_week || !newSchedule.start_time || !newSchedule.end_time) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("provider_availability_schedules")
        .insert({
          user_id: user.id,
          day_of_week: newSchedule.day_of_week,
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          timezone: newSchedule.timezone,
          is_enabled: true,
        });

      if (error) throw error;

      toast.success("Schedule added");
      loadSchedules();
      
      setNewSchedule({
        day_of_week: 1,
        start_time: "09:00:00",
        end_time: "17:00:00",
        is_enabled: true,
        timezone: newSchedule.timezone,
      });
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      toast.error(error.message || "Failed to add schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("provider_availability_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Schedule deleted successfully");
      loadSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkTimezoneUpdate = async (newTimezone: string) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("provider_availability_schedules")
        .update({ timezone: newTimezone })
        .eq("user_id", user.id);

      if (error) throw error;

      setDefaultTimezone(newTimezone);
      toast.success(`All schedules updated to ${TIMEZONES.find(tz => tz.value === newTimezone)?.label}`);
      loadSchedules();
    } catch (error) {
      console.error("Error updating timezones:", error);
      toast.error("Failed to update timezones");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (template: any) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("provider_availability_schedules")
        .delete()
        .eq("user_id", user.id);

      const schedulesToInsert = template.schedules.map((schedule: any) => ({
        user_id: user.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_enabled: true,
        timezone: defaultTimezone,
      }));

      const { error } = await supabase
        .from("provider_availability_schedules")
        .insert(schedulesToInsert);

      if (error) throw error;

      toast.success(`Applied "${template.name}" template`);
      loadSchedules();
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("provider_availability_schedules")
        .update({ is_enabled: enabled })
        .eq("id", id);

      if (error) throw error;

      setSchedules(schedules.map(s => s.id === id ? { ...s, is_enabled: enabled } : s));
      toast.success(enabled ? "Schedule enabled" : "Schedule disabled");
    } catch (error: any) {
      console.error("Error toggling schedule:", error);
      toast.error(error.message || "Failed to update schedule");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading schedules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ScheduleCalendar schedules={schedules} />
      
      <ScheduleTemplates 
        onApplyTemplate={handleApplyTemplate}
        disabled={saving}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recurring Availability Schedule
              </CardTitle>
              <CardDescription>
                Set your recurring weekly availability. Your status will automatically activate when these times arrive.
              </CardDescription>
            </div>
            <Switch
              checked={autoEnabled}
              onCheckedChange={handleAutoToggle}
              disabled={saving}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {autoEnabled && (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  When enabled, your Available Now status will automatically activate during your scheduled times.
                  You can still manually control it at any time. All times are in your selected timezone.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Your Timezone</Label>
                <Select
                  value={defaultTimezone}
                  onValueChange={(value) => {
                    setDefaultTimezone(value);
                    setNewSchedule({ ...newSchedule, timezone: value });
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Current time in {TIMEZONES.find(tz => tz.value === defaultTimezone)?.label}:{" "}
                  {new Date().toLocaleTimeString('en-US', { 
                    timeZone: defaultTimezone, 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </p>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-sm">Add New Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Day</Label>
                    <Select
                      value={newSchedule.day_of_week?.toString()}
                      onValueChange={(value) => 
                        setNewSchedule({ ...newSchedule, day_of_week: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Start Time</Label>
                    <Select
                      value={newSchedule.start_time}
                      onValueChange={(value) => 
                        setNewSchedule({ ...newSchedule, start_time: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {formatTime(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">End Time</Label>
                    <Select
                      value={newSchedule.end_time}
                      onValueChange={(value) => 
                        setNewSchedule({ ...newSchedule, end_time: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {formatTime(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddSchedule}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {schedules.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Your Schedules</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={saving}>
                          <Globe className="h-4 w-4 mr-2" />
                          Bulk Update Timezone
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update All Schedules Timezone</DialogTitle>
                          <DialogDescription>
                            This will change the timezone for all your existing schedules.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>New Timezone</Label>
                            <Select
                              value={defaultTimezone}
                              onValueChange={(value) => setDefaultTimezone(value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIMEZONES.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => handleBulkTimezoneUpdate(defaultTimezone)}
                            disabled={saving}
                            className="w-full"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update All Schedules"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-background"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Switch
                            checked={schedule.is_enabled}
                            onCheckedChange={(checked) => 
                              schedule.id && handleToggleSchedule(schedule.id, checked)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              {" • "}
                              {TIMEZONES.find(tz => tz.value === schedule.timezone)?.label || schedule.timezone}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schedules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No schedules yet. Add your first schedule above or use a template!
                </p>
              )}
            </>
          )}

          {!autoEnabled && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Enable automatic availability to set your recurring schedule
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
