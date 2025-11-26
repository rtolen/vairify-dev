import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, MapPin, Users, Shield } from "lucide-react";

interface PrivacySettings {
  profile_visibility: "public" | "members_only" | "private";
  location_visibility: "exact" | "city" | "state" | "hidden";
  online_status_visible: boolean;
  show_last_active: boolean;
  allow_screenshots: boolean;
  show_in_search: boolean;
  allow_messages_from: "everyone" | "verified_only" | "favorites_only";
}

export const PrivacySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: "public",
    location_visibility: "city",
    online_status_visible: true,
    show_last_active: true,
    allow_screenshots: true,
    show_in_search: true,
    allow_messages_from: "everyone",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility as any,
          location_visibility: data.location_visibility as any,
          online_status_visible: data.online_status_visible,
          show_last_active: data.show_last_active,
          allow_screenshots: data.allow_screenshots,
          show_in_search: data.show_in_search,
          allow_messages_from: data.allow_messages_from as any,
        });
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("privacy_settings")
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <CardTitle>Profile Visibility</CardTitle>
          </div>
          <CardDescription>
            Control who can view your profile and posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value: any) => updateSetting("profile_visibility", value)}
            >
              <SelectTrigger id="profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Everyone can see</SelectItem>
                <SelectItem value="members_only">Members Only</SelectItem>
                <SelectItem value="private">Private - Only approved users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show in search results</Label>
              <p className="text-sm text-muted-foreground">
                Allow your profile to appear in directory searches
              </p>
            </div>
            <Switch
              checked={settings.show_in_search}
              onCheckedChange={(checked) => updateSetting("show_in_search", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle>Location Privacy</CardTitle>
          </div>
          <CardDescription>
            Choose how much location information to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="location-visibility">Location Display</Label>
            <Select
              value={settings.location_visibility}
              onValueChange={(value: any) => updateSetting("location_visibility", value)}
            >
              <SelectTrigger id="location-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact Location</SelectItem>
                <SelectItem value="city">City Only</SelectItem>
                <SelectItem value="state">State Only</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Activity & Status</CardTitle>
          </div>
          <CardDescription>
            Manage your online presence visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show online status</Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you're online
              </p>
            </div>
            <Switch
              checked={settings.online_status_visible}
              onCheckedChange={(checked) => updateSetting("online_status_visible", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show last active</Label>
              <p className="text-sm text-muted-foreground">
                Display when you were last active
              </p>
            </div>
            <Switch
              checked={settings.show_last_active}
              onCheckedChange={(checked) => updateSetting("show_last_active", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Content Protection</CardTitle>
          </div>
          <CardDescription>
            Protect your content from unauthorized use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Screenshot detection</Label>
              <p className="text-sm text-muted-foreground">
                Warn when screenshots might be taken (when supported)
              </p>
            </div>
            <Switch
              checked={!settings.allow_screenshots}
              onCheckedChange={(checked) => updateSetting("allow_screenshots", !checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messages-from">Accept messages from</Label>
            <Select
              value={settings.allow_messages_from}
              onValueChange={(value: any) => updateSetting("allow_messages_from", value)}
            >
              <SelectTrigger id="messages-from">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="verified_only">V.A.I. Verified Only</SelectItem>
                <SelectItem value="favorites_only">Favorites Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Privacy Settings
      </Button>
    </div>
  );
};