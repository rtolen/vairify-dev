import { useState, useEffect } from "react";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AvailableNowToggle = () => {
  const [loading, setLoading] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [location, setLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    loadAvailabilityStatus();
  }, []);

  useEffect(() => {
    if (!availableNow || !startedAt) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const started = new Date(startedAt);
      const now = new Date();
      const elapsed = now.getTime() - started.getTime();
      const remaining = 3600000 - elapsed; // 1 hour in ms

      if (remaining <= 0) {
        setTimeRemaining("Expiring soon...");
        loadAvailabilityStatus();
      } else {
        const minutes = Math.floor(remaining / 60000);
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [availableNow, startedAt]);

  const loadAvailabilityStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("available_now, available_now_location, available_now_started_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setAvailableNow(data?.available_now || false);
      setLocation(data?.available_now_location as { address: string; lat: number; lng: number } | null);
      setStartedAt(data?.available_now_started_at);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const address = data.display_name || "Unknown location";

            resolve({ lat, lng, address });
          } catch (error) {
            resolve({ lat, lng, address: "Unknown location" });
          }
        },
        (error) => reject(error)
      );
    });
  };

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (checked) {
        // Turning ON - get location first
        const locationData = await getCurrentLocation();
        
        const { error } = await supabase
          .from("provider_profiles")
          .update({
            available_now: true,
            available_now_started_at: new Date().toISOString(),
            available_now_location: locationData,
          })
          .eq("user_id", user.id);

        if (error) throw error;

        setAvailableNow(true);
        setLocation(locationData);
        setStartedAt(new Date().toISOString());
        toast.success("You're now Available! Expires in 1 hour.");
      } else {
        // Turning OFF
        const { error } = await supabase
          .from("provider_profiles")
          .update({
            available_now: false,
            available_now_started_at: null,
            available_now_location: null,
          })
          .eq("user_id", user.id);

        if (error) throw error;

        setAvailableNow(false);
        setLocation(null);
        setStartedAt(null);
        toast.success("Available Now status disabled");
      }
    } catch (error: any) {
      console.error("Error toggling availability:", error);
      toast.error(error.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={availableNow ? "border-green-500/50 bg-green-500/5" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Available Now
              {availableNow && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {availableNow 
                ? "You're visible to clients looking for providers nearby" 
                : "Turn on to appear in Available Now searches"}
            </CardDescription>
          </div>
          <Switch
            checked={availableNow}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardHeader>

      {availableNow && (
        <CardContent className="space-y-3">
          {location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{location.address}</span>
            </div>
          )}

          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">{timeRemaining}</span>
            </div>
          )}

          <Alert className="bg-green-500/10 border-green-500/20">
            <AlertDescription className="text-xs text-muted-foreground">
              Your Available Now status will automatically expire after 1 hour or when you accept a VAI Check encounter.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {loading && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating availability...</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
