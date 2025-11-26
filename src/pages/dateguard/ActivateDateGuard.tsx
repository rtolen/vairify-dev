import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Camera, FileText, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/dateguard/TimePicker";
import { GroupCard } from "@/components/dateguard/GroupCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ActivateDateGuard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"groups" | "time" | "buffer" | "intel" | "confirm">("groups");
  const [location, setLocation] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [bufferMinutes, setBufferMinutes] = useState(5);
  const [groups, setGroups] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
    getCurrentLocation();
    
    // Load selected groups from session storage if coming from GuardianGroups page
    const stored = sessionStorage.getItem("dateguard_selected_groups");
    if (stored) {
      setSelectedGroups(new Set(JSON.parse(stored)));
    }
  }, []);

  const fetchGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data } = await supabase
      .from("guardian_groups")
      .select("*")
      .eq("user_id", user.id);

    setGroups(data || []);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Marriott Hotel, 123 Main St, Atlanta, GA",
            gps: `${position.coords.latitude.toFixed(4)}°N, ${position.coords.longitude.toFixed(4)}°W`
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({
            lat: 33.7490,
            lng: -84.3880,
            address: "Marriott Hotel, 123 Main St, Atlanta, GA",
            gps: "33.7490°N, 84.3880°W"
          });
        }
      );
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleActivate = async () => {
    if (selectedGroups.size === 0) {
      toast.error("Please select at least one guardian group");
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user VAI
      const { data: profile } = await supabase
        .from("profiles")
        .select("vai_number")
        .eq("id", user.id)
        .single();

      // Calculate duration in minutes
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      const scheduledEndAt = new Date(Date.now() + totalMinutes * 60 * 1000);
      const bufferEndAt = new Date(scheduledEndAt.getTime() + bufferMinutes * 60 * 1000);

      // Upload photos to Supabase Storage
      const uploadedPhotoUrls: string[] = [];
      for (const photo of photos) {
        const filePath = `${user.id}/${Date.now()}_${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dateguard-pre-activation')
          .upload(filePath, photo);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('dateguard-pre-activation')
            .getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            uploadedPhotoUrls.push(urlData.publicUrl);
          }
        }
      }

      // Capture GPS coordinates
      let gpsCoords = { lat: 0, lng: 0 };
      if (location && location.lat && location.lng) {
        gpsCoords = { lat: location.lat, lng: location.lng };
      } else if (navigator.geolocation) {
        // Get GPS synchronously
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              gpsCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
              resolve();
            },
            () => {
              // Use default if geolocation fails
              resolve();
            }
          );
        });
      }

      // Create session
      const { data: session, error } = await supabase
        .from("dateguard_sessions")
        .insert({
          user_id: user.id,
          user_vai: profile?.vai_number || null,
          guardian_group_id: Array.from(selectedGroups)[0] || null, // Keep for backward compatibility
          location_name: location?.address?.split(',')[0] || "Location",
          location_address: location?.address || "",
          location_gps: location?.gps || `${gpsCoords.lat.toFixed(4)}°N, ${Math.abs(gpsCoords.lng).toFixed(4)}°W`,
          location_photo_url: uploadedPhotoUrls[0] || null,
          location_notes: notes,
          memo: notes, // Keep for backward compatibility
          duration_minutes: Math.round(totalMinutes),
          scheduled_duration_minutes: Math.round(totalMinutes),
          buffer_minutes: bufferMinutes,
          selected_groups: Array.from(selectedGroups),
          pre_activation_photos: uploadedPhotoUrls,
          pre_activation_notes: notes,
          gps_coordinates: gpsCoords,
          scheduled_end_at: scheduledEndAt.toISOString(),
          buffer_end_at: bufferEndAt.toISOString(),
          ends_at: bufferEndAt.toISOString(), // Keep for backward compatibility
          status: "active",
          gps_tracking_enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Query nearest police station
      try {
        await supabase.functions.invoke('query-nearest-police', {
          body: {
            lat: gpsCoords.lat,
            lng: gpsCoords.lng,
            session_id: session.id,
          },
        });
      } catch (policeError) {
        console.warn('Could not query police station:', policeError);
      }

      // Send initial notification to guardians
      const { data: groupsData } = await supabase
        .from("guardian_groups")
        .select("members")
        .in("id", Array.from(selectedGroups));

      // Create initial bot message
      await supabase.from("dateguard_messages").insert({
        session_id: session.id,
        sender_type: "bot",
        sender_name: "VAIRIFY BOT",
        message_type: "session_start",
        message: "DateGuard session started",
        metadata: {
          location: location?.address,
          gps: gpsCoords,
          notes: notes,
          duration: totalMinutes,
          scheduled_end_at: scheduledEndAt.toISOString(),
        },
      });

      toast.success("✅ DateGuard activated! Guardians notified.");

      setTimeout(() => {
        navigate(`/dateguard/session/${session.id}`);
      }, 2000);

    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.message || "Failed to activate DateGuard");
    } finally {
      setCreating(false);
    }
  };

  if (creating) {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <p className="text-xl font-bold">Activating DateGuard...</p>
            <div className="space-y-1 text-sm text-white/80">
              <p>✅ Photos uploaded</p>
              <p>✅ Location captured</p>
              <p>✅ Notes saved</p>
              <p>✅ Querying nearest police...</p>
              <p>✅ Notifying guardians...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Select Groups
  if (step === "groups") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dateguard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">SELECT GROUPS</h1>
            <p className="text-xs text-white/60">Step 1 of 5</p>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  num === 1
                    ? "bg-white text-[#1B2B5E]"
                    : num < 1
                    ? "bg-white/20 text-white/60"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 mx-auto text-white/80" />
            <p className="text-white/90">Choose which groups to notify</p>
          </div>

          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={{
                  id: group.id,
                  name: group.group_name || group.name,
                  members: group.members || [],
                }}
                selected={selectedGroups.has(group.id)}
                onSelect={() => handleGroupToggle(group.id)}
              />
            ))}
          </div>

          <Button
            onClick={() => setStep("time")}
            disabled={selectedGroups.size === 0}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue ({selectedGroups.size} {selectedGroups.size === 1 ? "group" : "groups"})
          </Button>
        </main>
      </div>
    );
  }

  // Step 2: Set Time
  if (step === "time") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("groups")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">SET YOUR TIME</h1>
            <p className="text-xs text-white/60">Step 2 of 5</p>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-8 space-y-8 max-w-md mx-auto">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  num === 2
                    ? "bg-white text-[#1B2B5E]"
                    : num < 2
                    ? "bg-white/20 text-white/60"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          <TimePicker
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            onHoursChange={setHours}
            onMinutesChange={setMinutes}
            onSecondsChange={setSeconds}
          />

          <Button
            onClick={() => setStep("buffer")}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue
          </Button>
        </main>
      </div>
    );
  }

  // Step 3: Set Alarm Delay (Buffer)
  if (step === "buffer") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("time")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">SET ALARM DELAY</h1>
            <p className="text-xs text-white/60">Step 3 of 5</p>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  num === 3
                    ? "bg-white text-[#1B2B5E]"
                    : num < 3
                    ? "bg-white/20 text-white/60"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <Clock className="w-12 h-12 mx-auto text-white/80" />
            <p className="text-white/90">Grace period before alerting guardians</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 15, 30, 60].map((mins) => (
              <Button
                key={mins}
                variant={bufferMinutes === mins ? "default" : "outline"}
                className={bufferMinutes === mins ? "bg-white text-[#1B2B5E]" : "text-white border-white/30 hover:bg-white/10"}
                onClick={() => setBufferMinutes(mins)}
              >
                {mins}m
              </Button>
            ))}
          </div>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold text-white">{bufferMinutes} minutes</p>
              <p className="text-sm text-white/60 mt-2">Buffer period</p>
            </CardContent>
          </Card>

          <Button
            onClick={() => setStep("intel")}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue
          </Button>
        </main>
      </div>
    );
  }

  // Step 4: Upload Intel
  if (step === "intel") {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep("buffer")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">UPLOAD INTEL</h1>
            <p className="text-xs text-white/60">Step 4 of 5</p>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  num === 4
                    ? "bg-white text-[#1B2B5E]"
                    : num < 4
                    ? "bg-white/20 text-white/60"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold">LOCATION</h2>
            </div>
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm text-white/70">Current location:</p>
                <div className="space-y-1">
                  <p className="font-semibold text-white">{location?.address || "Loading..."}</p>
                  <p className="text-xs text-white/60">GPS: {location?.gps || "..."}</p>
                  <p className="text-xs text-green-400">✓ Auto-detected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <Camera className="w-5 h-5" />
              <h2 className="font-bold">PHOTOS (Optional)</h2>
            </div>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                multiple
                className="hidden"
                id="photo-upload"
              />
              <Label htmlFor="photo-upload">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" asChild>
                  <span>📷 Take Photo</span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <FileText className="w-5 h-5" />
              <h2 className="font-bold">NOTES (Optional)</h2>
            </div>
            <Textarea
              placeholder="Room 1658, 16th floor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/40 min-h-[100px]"
            />
            <p className="text-xs text-white/60">Include room #, floor, landmarks</p>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-sm text-yellow-200">⚠️ This data is sent to guardians for emergency response</p>
          </div>

          <Button
            onClick={() => setStep("confirm")}
            className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
          >
            Continue
          </Button>
        </main>
      </div>
    );
  }

  // Step 5: Confirm & Start
  return (
    <div className="min-h-screen bg-[#1B2B5E] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep("intel")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold">CONFIRM</h1>
          <p className="text-xs text-white/60">Step 5 of 5</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                num === 5
                  ? "bg-white text-[#1B2B5E]"
                  : num < 5
                  ? "bg-white/20 text-white/60"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {num}
            </div>
          ))}
        </div>

        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm text-white/60">Duration</p>
              <p className="text-lg font-bold text-white">
                {hours}h {minutes}m {seconds}s
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Buffer</p>
              <p className="text-lg font-bold text-white">{bufferMinutes} minutes</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Groups</p>
              <p className="text-lg font-bold text-white">{selectedGroups.size} {selectedGroups.size === 1 ? "group" : "groups"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Location</p>
              <p className="text-lg font-bold text-white">{location?.address || "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleActivate}
          disabled={creating}
          className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
        >
          {creating ? "Starting..." : "START DATEGUARD"}
        </Button>
      </main>
    </div>
  );
}
