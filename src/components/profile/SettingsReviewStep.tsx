import { UseFormReturn } from "react-hook-form";
import { Calendar, Settings as SettingsIcon, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

interface SettingsReviewStepProps {
  form: UseFormReturn<any>;
  completionPercentage: number;
}

export const SettingsReviewStep = ({ form, completionPercentage }: SettingsReviewStepProps) => {
  const formValues = form.getValues();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Settings & Review</h2>
        <p className="text-muted-foreground">
          Configure your availability and review your profile
        </p>
      </div>

      {/* Profile Completion Summary */}
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Completion</span>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {completionPercentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {formValues.username ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={formValues.username ? "text-foreground" : "text-muted-foreground"}>
              Username set
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {formValues.servicesOffered?.length > 0 ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={formValues.servicesOffered?.length > 0 ? "text-foreground" : "text-muted-foreground"}>
              {formValues.servicesOffered?.length || 0} services selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {(formValues.height || formValues.hairColor || formValues.bodyType) ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={(formValues.height || formValues.hairColor || formValues.bodyType) ? "text-foreground" : "text-muted-foreground"}>
              Physical attributes added
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {formValues.addOns?.length > 0 ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
            )}
            <span className={formValues.addOns?.length > 0 ? "text-foreground" : "text-muted-foreground"}>
              {formValues.addOns?.length || 0} add-ons selected
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="flex items-center gap-2">
              Availability
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="acceptingClients"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="acceptingClients" className="text-base">
                  Currently Accepting New Clients
                </Label>
                <Switch
                  id="acceptingClients"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          
          <FormField
            control={form.control}
            name="outcalls"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="outcalls" className="text-base">
                  Available for Outcalls
                </Label>
                <Switch
                  id="outcalls"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          
          <FormField
            control={form.control}
            name="incalls"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="incalls" className="text-base">
                  Available for Incalls
                </Label>
                <Switch
                  id="incalls"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          
          <FormField
            control={form.control}
            name="tours"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <Label htmlFor="tours" className="text-base">
                  Available for Tours
                </Label>
                <Switch
                  id="tours"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Profile Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="visibleInDirectory"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="visibleInDirectory" className="text-base">
                    Make profile visible in directory
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Clients can find you in the provider directory
                  </p>
                </div>
                <Switch
                  id="visibleInDirectory"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          
          <FormField
            control={form.control}
            name="allowDirectBooking"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowDirectBooking" className="text-base">
                    Allow direct booking requests
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Clients can send you booking requests
                  </p>
                </div>
                <Switch
                  id="allowDirectBooking"
                  checked={field.value}
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
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Summary Note */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-center text-muted-foreground">
            💡 You can edit all of these settings anytime from your profile page
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
