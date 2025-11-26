import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  emergency_alerts: boolean;
  referral_updates: boolean;
  marketing_emails: boolean;
  application_status_emails: boolean;
}

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    emergency_alerts: true,
    referral_updates: true,
    marketing_emails: false,
    application_status_emails: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast.error("Failed to load notification settings");
      setLoading(false);
      return;
    }

    if (data) {
      setPreferences({
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        sms_notifications: data.sms_notifications,
        emergency_alerts: data.emergency_alerts,
        referral_updates: data.referral_updates,
        marketing_emails: data.marketing_emails,
        application_status_emails: data.application_status_emails ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ...preferences,
      });

    if (error) {
      toast.error("Failed to save notification preferences");
    } else {
      toast.success("Notification preferences saved!");
    }
    setSaving(false);
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage what emails you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive general email notifications
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={() => togglePreference('email_notifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing_emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and promotions
              </p>
            </div>
            <Switch
              id="marketing_emails"
              checked={preferences.marketing_emails}
              onCheckedChange={() => togglePreference('marketing_emails')}
            />
          </div>


          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="referral_updates">Referral Updates</Label>
              <p className="text-sm text-muted-foreground">
                When your referrals sign up or upgrade
              </p>
            </div>
            <Switch
              id="referral_updates"
              checked={preferences.referral_updates}
              onCheckedChange={() => togglePreference('referral_updates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="application_status_emails">Application Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                When your influencer/affiliate application status changes
              </p>
            </div>
            <Switch
              id="application_status_emails"
              checked={preferences.application_status_emails}
              onCheckedChange={() => togglePreference('application_status_emails')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Manage mobile and browser notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your devices
              </p>
            </div>
            <Switch
              id="push_notifications"
              checked={preferences.push_notifications}
              onCheckedChange={() => togglePreference('push_notifications')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emergency_alerts" className="text-destructive">
                Emergency Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Critical safety alerts (always recommended)
              </p>
            </div>
            <Switch
              id="emergency_alerts"
              checked={preferences.emergency_alerts}
              onCheckedChange={() => togglePreference('emergency_alerts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>
            Text message alerts (standard rates apply)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms_notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important alerts via SMS
              </p>
            </div>
            <Switch
              id="sms_notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={() => togglePreference('sms_notifications')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
