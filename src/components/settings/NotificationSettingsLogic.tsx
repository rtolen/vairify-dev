import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useNotificationSettings = (
  setSettings: (settings: any) => void,
  setLoading: (loading: boolean) => void
) => {
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (data) {
      setSettings({
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        sms_notifications: data.sms_notifications,
        emergency_alerts: data.emergency_alerts,
        referral_updates: data.referral_updates,
        marketing_emails: data.marketing_emails,
      });
    }
    setLoading(false);
  };

  const saveSettings = async (newSettings: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ...newSettings,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Notification settings saved",
    });
  };

  return { saveSettings };
};
