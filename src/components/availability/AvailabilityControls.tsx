import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Users, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export const AvailabilityControls = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [acceptInvitations, setAcceptInvitations] = useState(true);
  const [radius, setRadius] = useState("5");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    loadAvailabilitySettings();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setAvailableNow(false);
        setExpiresAt(null);
        setTimeRemaining("");
        toast({
          title: "Available Now Expired",
          description: "Your 1-hour availability window has ended.",
        });
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, toast]);

  const loadAvailabilitySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("available_now, available_now_started_at, available_now_location, accept_invitations")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setAvailableNow(data.available_now || false);
        setAcceptInvitations(data.accept_invitations ?? true);
        
        if (data.available_now_location && typeof data.available_now_location === 'object') {
          const loc = data.available_now_location as any;
          setLocation({
            lat: loc.lat,
            lng: loc.lng,
            address: loc.address
          });
          setRadius(loc.radius_miles?.toString() || "5");
        }

        if (data.available_now && data.available_now_started_at) {
          const startTime = new Date(data.available_now_started_at);
          const expiry = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
          setExpiresAt(expiry);
        }
      }
    } catch (error) {
      console.error("Error loading availability settings:", error);
    }
  };

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            resolve({
              lat: latitude,
              lng: longitude,
              address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          } catch {
            resolve({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleAvailableNowToggle = async (checked: boolean) => {
    if (checked && !location) {
      toast({
        title: "Location Required",
        description: "Please set your location before enabling Available Now.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: any = {
        available_now: checked,
        available_now_started_at: checked ? new Date().toISOString() : null,
      };

      if (checked && location) {
        updateData.available_now_location = {
          ...location,
          radius_miles: parseInt(radius)
        };
      }

      const { error } = await supabase
        .from("provider_profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setAvailableNow(checked);
      
      if (checked) {
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        setExpiresAt(expiry);
        toast({
          title: "Available Now Active",
          description: "You're now visible to nearby clients for 1 hour.",
        });
      } else {
        setExpiresAt(null);
        setTimeRemaining("");
        toast({
          title: "Available Now Disabled",
          description: "You're no longer visible in Available Now searches.",
        });
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitationsToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("provider_profiles")
        .update({ accept_invitations: checked })
        .eq("user_id", user.id);

      if (error) throw error;

      setAcceptInvitations(checked);
      toast({
        title: checked ? "Invitations Enabled" : "Invitations Disabled",
        description: checked 
          ? "You'll receive client invitation requests to review."
          : "You won't receive new invitation requests.",
      });
    } catch (error) {
      console.error("Error updating invitations:", error);
      toast({
        title: "Error",
        description: "Failed to update invitation settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocation = async () => {
    setLoading(true);
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      
      // If Available Now is active, update the location immediately
      if (availableNow) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
          .from("provider_profiles")
          .update({
            available_now_location: {
              ...locationData,
              radius_miles: parseInt(radius)
            }
          })
          .eq("user_id", user.id);

        if (error) throw error;
      }

      toast({
        title: "Location Set",
        description: "Your current location has been saved.",
      });
    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location Error",
        description: "Failed to get your current location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = async (value: string) => {
    setRadius(value);
    
    // If Available Now is active and location is set, update immediately
    if (availableNow && location) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("provider_profiles")
          .update({
            available_now_location: {
              ...location,
              radius_miles: parseInt(value)
            }
          })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error updating radius:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Available Now Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <Label htmlFor="available-now" className="text-base font-semibold">
                    Available Now
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Become visible to nearby clients for 1 hour
                </p>
              </div>
              <Switch
                id="available-now"
                checked={availableNow}
                onCheckedChange={handleAvailableNowToggle}
                disabled={loading}
              />
            </div>

            {availableNow && timeRemaining && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Active for {timeRemaining} remaining
                </AlertDescription>
              </Alert>
            )}

            {/* Location Settings */}
            <div className="space-y-3 pl-7 border-l-2 border-border">
              <div className="space-y-2">
                <Label className="text-sm">Location</Label>
                {location ? (
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm flex-1">{location.address}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No location set</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetLocation}
                  disabled={loading}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {location ? "Update Location" : "Set Current Location"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius" className="text-sm">Search Radius</Label>
                <Select value={radius} onValueChange={handleRadiusChange} disabled={loading}>
                  <SelectTrigger id="radius">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* Accept Invitations Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Label htmlFor="accept-invitations" className="text-base font-semibold">
                    Accept Invitations
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive and selectively respond to client requests
                </p>
              </div>
              <Switch
                id="accept-invitations"
                checked={acceptInvitations}
                onCheckedChange={handleAcceptInvitationsToggle}
                disabled={loading}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                With invitations, you can review client preferences and choose which requests to respond to, 
                avoiding bombardment while staying selective.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Card>
    </div>
  );
};
