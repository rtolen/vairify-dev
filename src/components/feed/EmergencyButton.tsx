import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const EmergencyButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const getCurrentLocation = (): Promise<{ gps: string; address: string }> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const gps = `${position.coords.latitude},${position.coords.longitude}`;
            // In production, you'd reverse geocode this to get address
            resolve({
              gps,
              address: `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
            });
          },
          () => {
            resolve({ gps: 'unknown', address: 'Location unavailable' });
          }
        );
      } else {
        resolve({ gps: 'unknown', address: 'Location unavailable' });
      }
    });
  };

  const handleEmergency = async () => {
    setIsTriggering(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Authentication required");
        setIsTriggering(false);
        return;
      }

      // Get current location
      const location = await getCurrentLocation();

      // Call emergency alert edge function
      const { data, error } = await supabase.functions.invoke('send-emergency-alert', {
        body: {
          user_id: user.id,
          location_gps: location.gps,
          location_address: location.address,
          trigger_type: 'panic_button'
        }
      });

      if (error) throw error;

      toast.success(
        `🚨 DATEGUARD SOS ACTIVATED\nNotified ${data.guardians_notified} guardian(s)`,
        {
          duration: 5000,
          className: "bg-destructive text-destructive-foreground"
        }
      );

      setShowConfirm(false);
    } catch (error: any) {
      console.error('Emergency alert error:', error);
      toast.error("Failed to send emergency alert. Please call 911 directly.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-destructive rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 animate-pulse"
        aria-label="DateGuard SOS"
      >
        <AlertTriangle className="w-7 h-7 text-destructive-foreground" />
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              DATEGUARD SOS
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">This will immediately:</p>
              <ul className="space-y-1 text-sm">
                <li>• Alert ALL your guardians</li>
                <li>• Share your GPS location</li>
                <li>• Create time-stamped emergency record</li>
                <li>• Trigger emergency protocol</li>
              </ul>
              <p className="text-destructive font-semibold mt-4">
                Only press if you are in real danger.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTriggering}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergency}
              disabled={isTriggering}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isTriggering ? "ACTIVATING DATEGUARD SOS..." : "🚨 ACTIVATE DATEGUARD SOS"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
