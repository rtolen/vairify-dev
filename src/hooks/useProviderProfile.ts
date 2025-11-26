import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

export interface ProviderProfile {
  id?: string;
  user_id?: string;
  username: string;
  avatar_url?: string;
  public_gallery: GalleryPhoto[];
  members_gallery: GalleryPhoto[];
  height?: string;
  weight?: string;
  hair_color?: string;
  hair_length?: string;
  eye_color?: string;
  body_type?: string;
  ethnicity?: string;
  age_range?: string;
  services_offered: string[];
  add_ons: string[];
  availability: {
    acceptingClients: boolean;
    outcalls: boolean;
    incalls: boolean;
    tours: boolean;
  };
  profile_settings: {
    visibleInDirectory: boolean;
    allowDirectBooking: boolean;
    showOnlineStatus: boolean;
  };
  profile_completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export const useProviderProfile = () => {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Transform database format to form format
        setProfile({
          ...data,
          public_gallery: (data.public_gallery as unknown as GalleryPhoto[]) || [],
          members_gallery: (data.members_gallery as unknown as GalleryPhoto[]) || [],
          services_offered: (data.services_offered as unknown as string[]) || [],
          add_ons: (data.add_ons as unknown as string[]) || [],
          availability: (data.availability as {
            acceptingClients: boolean;
            outcalls: boolean;
            incalls: boolean;
            tours: boolean;
          }) || {
            acceptingClients: true,
            outcalls: false,
            incalls: false,
            tours: true,
          },
          profile_settings: (data.profile_settings as {
            visibleInDirectory: boolean;
            allowDirectBooking: boolean;
            showOnlineStatus: boolean;
          }) || {
            visibleInDirectory: true,
            allowDirectBooking: true,
            showOnlineStatus: false,
          },
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: Partial<ProviderProfile>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save your profile");
        return false;
      }

      // Transform form data to database format
      const dbData = {
        user_id: user.id,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        public_gallery: JSON.parse(JSON.stringify(profileData.public_gallery || [])),
        members_gallery: JSON.parse(JSON.stringify(profileData.members_gallery || [])),
        height: profileData.height,
        weight: profileData.weight,
        hair_color: profileData.hair_color,
        hair_length: profileData.hair_length,
        eye_color: profileData.eye_color,
        body_type: profileData.body_type,
        ethnicity: profileData.ethnicity,
        age_range: profileData.age_range,
        services_offered: profileData.services_offered || [],
        add_ons: profileData.add_ons || [],
        availability: profileData.availability || {
          acceptingClients: true,
          outcalls: false,
          incalls: false,
          tours: true,
        },
        profile_settings: profileData.profile_settings || {
          visibleInDirectory: true,
          allowDirectBooking: true,
          showOnlineStatus: false,
        },
        profile_completion_percentage: calculateCompletionPercentage(profileData),
      };

      const { data, error } = await supabase
        .from("provider_profiles")
        .upsert([dbData], {
          onConflict: "user_id",
        })
        .select()
        .single();

      if (error) throw error;

      // Transform response back to ProviderProfile format
      if (data) {
        const transformedData: ProviderProfile = {
          ...data,
          public_gallery: (data.public_gallery as unknown as GalleryPhoto[]) || [],
          members_gallery: (data.members_gallery as unknown as GalleryPhoto[]) || [],
          services_offered: (data.services_offered as unknown as string[]) || [],
          add_ons: (data.add_ons as unknown as string[]) || [],
          availability: (data.availability as ProviderProfile['availability']) || dbData.availability,
          profile_settings: (data.profile_settings as ProviderProfile['profile_settings']) || dbData.profile_settings,
        };
        setProfile(transformedData);
      }
      toast.success("Profile saved successfully!");
      return true;
    } catch (error: any) {
      console.error("Error saving profile:", error);
      
      // Handle specific errors
      if (error.code === "23505") {
        toast.error("This username is already taken. Please choose another.");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionPercentage = (profileData: Partial<ProviderProfile>): number => {
    let filled = 0;
    const totalFields = 20;

    if (profileData.username) filled++;
    if (profileData.avatar_url) filled += 2;
    if (profileData.public_gallery && profileData.public_gallery.length > 0) filled += 2;
    if (profileData.members_gallery && profileData.members_gallery.length > 0) filled += 2;
    if (profileData.height) filled++;
    if (profileData.weight) filled++;
    if (profileData.hair_color) filled++;
    if (profileData.hair_length) filled++;
    if (profileData.eye_color) filled++;
    if (profileData.body_type) filled++;
    if (profileData.ethnicity) filled++;
    if (profileData.age_range) filled++;
    if (profileData.services_offered && profileData.services_offered.length > 0) filled += 3;
    if (profileData.add_ons && profileData.add_ons.length > 0) filled += 2;
    filled += 5; // For settings (always have values)

    return Math.round((filled / totalFields) * 100);
  };

  return {
    profile,
    loading,
    saving,
    saveProfile,
    reloadProfile: loadProfile,
  };
};
