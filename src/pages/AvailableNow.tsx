import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Clock, Search } from "lucide-react";
import { toast } from "sonner";

interface AvailableProvider {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  available_now_started_at: string;
  available_now_location: {
    address: string;
    lat: number;
    lng: number;
  } | null;
  distance?: number;
}

const AvailableNow = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<AvailableProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusFilter, setRadiusFilter] = useState("50");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("id, user_id, username, avatar_url, available_now_started_at, available_now_location")
        .eq("available_now", true)
        .not("available_now_location", "is", null);

      if (error) throw error;

      let providersWithDistance = data as AvailableProvider[];

      // Calculate distances if user location is available
      if (userLocation) {
        providersWithDistance = providersWithDistance.map(provider => {
          if (provider.available_now_location) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              provider.available_now_location.lat,
              provider.available_now_location.lng
            );
            return { ...provider, distance };
          }
          return provider;
        });

        // Filter by radius
        const radius = parseInt(radiusFilter);
        providersWithDistance = providersWithDistance.filter(
          p => !p.distance || p.distance <= radius
        );

        // Sort by distance
        providersWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setProviders(providersWithDistance);
    } catch (error) {
      console.error("Error loading providers:", error);
      toast.error("Failed to load available providers");
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location");
        }
      );
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    loadProviders();

    // Set up realtime subscription
    const channel = supabase
      .channel("available-now-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_profiles",
          filter: "available_now=eq.true",
        },
        () => {
          loadProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [radiusFilter, userLocation]);

  const getTimeAvailable = (startedAt: string) => {
    const started = new Date(startedAt);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - started.getTime()) / 60000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const filteredProviders = providers.filter(provider =>
    provider.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Available Now</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Radius</label>
              <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                  <SelectItem value="500">500 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Available Providers ({filteredProviders.length})
            </h2>
            <Badge variant="secondary" className="animate-pulse">
              Live
            </Badge>
          </div>

          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : filteredProviders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No providers available in your area right now
              </CardContent>
            </Card>
          ) : (
            filteredProviders.map((provider) => (
              <Card
                key={provider.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/profile/${provider.user_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={provider.avatar_url || "/placeholder.svg"}
                        alt={provider.username}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-background rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{provider.username}</h3>
                      
                      {provider.available_now_location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{provider.available_now_location.address}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeAvailable(provider.available_now_started_at)}</span>
                        </div>
                        
                        {provider.distance !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {provider.distance.toFixed(1)} mi away
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableNow;
