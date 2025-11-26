import { AvailabilityControls } from "@/components/availability/AvailabilityControls";
import { AvailabilitySchedule } from "@/components/availability/AvailabilitySchedule";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AvailabilitySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Availability Settings</h1>
            <p className="text-muted-foreground">
              Control how clients can discover and request encounters
            </p>
          </div>
        </div>

        <AvailabilityControls />

        <AvailabilitySchedule />

        <Card className="p-6 bg-muted/50">
          <h2 className="font-semibold mb-4">How It Works</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-1">Available Now</h3>
              <p>
                Toggle this on when you're ready to meet clients immediately. You'll appear in "Available Now" 
                searches for nearby clients. Your location and radius determine your visibility. This status 
                automatically expires after 1 hour or when you accept a VAI Check.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Accept Invitations</h3>
              <p>
                When enabled, you'll see client invitation requests with their preferences. You can selectively 
                choose which invitations to respond to by sending your profile. This gives you control without 
                the bombardment of direct requests.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Availability Schedule</h3>
              <p>
                Set recurring weekly times when you want to automatically become Available Now. 
                Your status will activate during scheduled times and you can still manually control it anytime.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
