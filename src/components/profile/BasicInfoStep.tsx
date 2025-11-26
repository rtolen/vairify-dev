import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { User, Check, X, Camera, Image, Globe, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { GalleryUpload } from "./GalleryUpload";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface BasicInfoStepProps {
  form: UseFormReturn<any>;
}

export const BasicInfoStep = ({ form }: BasicInfoStepProps) => {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Debounced username check
  useEffect(() => {
    const username = form.getValues("username");
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(() => {
      // Mock API call - replace with actual API
      const taken = ["admin", "test", "vairify"].includes(username.toLowerCase());
      setUsernameStatus(taken ? "taken" : "available");
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.watch("username")]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
        <p className="text-muted-foreground">
          Start with your username. Everything else on this page is optional.
        </p>
      </div>

      {/* Required: Username */}
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

      {/* Profile Photo Upload */}
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

      {/* Gallery Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <CardTitle className="flex items-center gap-2">
              Gallery Photos
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
          </div>
          <CardDescription>
            Add up to 8 photos for each gallery. Public photos are shown to everyone, members-only photos require verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Public Gallery */}
            <AccordionItem value="public-gallery">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Public Gallery</span>
                  <Badge variant="secondary" className="ml-2">
                    {form.watch("publicGallery")?.length || 0}/8
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <FormField
                  control={form.control}
                  name="publicGallery"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <GalleryUpload
                          photos={field.value || []}
                          onPhotosChange={field.onChange}
                          maxPhotos={8}
                          galleryType="public"
                        />
                      </FormControl>
                      <FormDescription>
                        These photos are visible to anyone who scans your QR code
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Members-Only Gallery */}
            <AccordionItem value="members-gallery">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Members-Only Gallery</span>
                  <Badge variant="secondary" className="ml-2">
                    {form.watch("membersGallery")?.length || 0}/8
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <FormField
                  control={form.control}
                  name="membersGallery"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <GalleryUpload
                          photos={field.value || []}
                          onPhotosChange={field.onChange}
                          maxPhotos={8}
                          galleryType="members"
                        />
                      </FormControl>
                      <FormDescription>
                        These photos are only visible to verified Vairify members
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-muted-foreground">About & Location (Coming Soon)</CardTitle>
          <CardDescription>
            Bio, service areas, and languages will be added in future updates
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
