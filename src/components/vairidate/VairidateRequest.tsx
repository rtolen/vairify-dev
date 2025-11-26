import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VairidateRequestProps {
  providerId: string;
  providerName: string;
  onClose?: () => void;
}

export function VairidateRequest({ providerId, providerName, onClose }: VairidateRequestProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    duration: "1",
    services: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create VAI check session first
      const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: session, error: sessionError } = await supabase
        .from("vai_check_sessions")
        .insert({
          provider_id: providerId,
          client_id: user.id,
          session_code: sessionCode,
          status: "pending_provider_response",
          metadata: {
            requested_date: formData.date,
            requested_time: formData.time,
            duration_hours: formData.duration,
            services: formData.services,
            notes: formData.notes,
          },
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create encounter record
      const { error: encounterError } = await supabase
        .from("encounters")
        .insert({
          session_id: session.id,
          provider_id: providerId,
          client_id: user.id,
          status: "vairidate_pending",
        });

      if (encounterError) throw encounterError;

      toast({
        title: "Request Sent",
        description: `Your Vairidate request has been sent to ${providerName}`,
      });

      navigate("/feed");
      onClose?.();
    } catch (error) {
      console.error("Error creating Vairidate request:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule with {providerName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="0.5"
                step="0.5"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">Requested Services</Label>
              <Textarea
                id="services"
                placeholder="Describe the services you're interested in..."
                required
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Next Steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>You'll complete a facial scan for VAI verification</li>
                <li>Provider receives your request with profile</li>
                <li>Provider can accept, decline, or suggest changes</li>
                <li>If accepted, both parties sign mutual consent</li>
                <li>Final facial verification before meeting</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
