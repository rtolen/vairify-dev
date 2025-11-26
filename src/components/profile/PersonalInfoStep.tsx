import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { User, Check, X, Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { supabase } from "@/integrations/supabase/client";

interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
  userRole?: 'provider' | 'client' | null;
}

export const PersonalInfoStep = ({ form, userRole }: PersonalInfoStepProps) => {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Debounced username check
  useEffect(() => {
    const username = form.getValues("username");
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        // Check if username is taken
        const { data, error } = await supabase
          .from('provider_profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) throw error;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // If username exists and belongs to someone else, it's taken
        if (data && data.username !== user?.id) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.watch("username")]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
        <p className="text-muted-foreground">
          {userRole === 'provider'
            ? 'Start with your username. Everything else is optional.'
            : 'Add your personal information. Everything is optional.'}
        </p>
      </div>

      {/* Required: Username (Provider only) */}
      {userRole === 'provider' && (
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Username
              <span className="text-destructive text-xl">*</span>
            </CardTitle>
          </div>
          <CardDescription>
            Your professional display name. This is how clients will find you. Cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Enter username"
                      className="text-lg h-12 pr-10"
                      onChange={(e) => {
                        field.onChange(e.target.value.toLowerCase());
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                      {usernameStatus === "available" && (
                        <Check className="w-5 h-5 text-success" />
                      )}
                      {usernameStatus === "taken" && (
                        <X className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  3-20 characters, letters, numbers, and underscores only
                </FormDescription>
                {usernameStatus === "taken" && (
                  <p className="text-sm text-destructive">Username is already taken</p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-sm text-success">Username is available!</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      )}

      {/* Optional: Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bio
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Tell clients about yourself. Keep it professional and concise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write a brief bio about yourself..."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0} / 500 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Optional: Profile Photo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Profile Photo
              <Badge variant="secondary" className="text-xs bg-primary/20">Recommended</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Upload a clear, professional photo of yourself. This will be displayed on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ProfilePhotoUpload
                    currentPhotoUrl={field.value}
                    onPhotoChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Your photo helps clients recognize you and builds trust
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

