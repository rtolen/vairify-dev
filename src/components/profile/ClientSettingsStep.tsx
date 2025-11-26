import { UseFormReturn } from "react-hook-form";
import { Settings as SettingsIcon, Shield, Bell, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ClientSettingsStepProps {
  form: UseFormReturn<any>;
}

export const ClientSettingsStep = ({ form }: ClientSettingsStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
        <p className="text-muted-foreground">
          Configure your profile visibility and preferences. All fields are optional.
        </p>
      </div>

      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bio
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Tell others about yourself. Keep it professional and concise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  {...field}
                  placeholder="Write a brief bio about yourself..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {field.value?.length || 0} / 500 characters
                </p>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Profile Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Profile Links
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Add links to your social media or website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* This would be expanded to support multiple links */}
            <FormField
              control={form.control}
              name="profileLinks"
              render={() => (
                <FormItem>
                  <p className="text-sm text-muted-foreground">
                    Profile links management will be added in Settings page after profile creation.
                  </p>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Privacy Settings</CardTitle>
          </div>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="profileVisible"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profileVisible" className="text-base">
                    Make profile visible to others
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other users to find and view your profile
                  </p>
                </div>
                <Switch
                  id="profileVisible"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="showOnlineStatus"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showOnlineStatus" className="text-base">
                    Show online status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display when you're active on the platform
                  </p>
                </div>
                <Switch
                  id="showOnlineStatus"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="allowMessages"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMessages" className="text-base">
                    Allow direct messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Let other users send you messages
                  </p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="emailNotifications"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="text-base">
                  Email notifications
                </Label>
                <Switch
                  id="emailNotifications"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="pushNotifications"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications" className="text-base">
                  Push notifications
                </Label>
                <Switch
                  id="pushNotifications"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Summary Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-center text-foreground">
            💡 You can edit all of these settings anytime from your Settings page
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

