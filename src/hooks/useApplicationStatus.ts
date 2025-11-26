import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useApplicationStatus = () => {
  const [hasPendingNotification, setHasPendingNotification] = useState(false);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: application } = await supabase
          .from('influencer_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (application && application.status === 'pending') {
          setHasPendingNotification(true);
        }

        // Check localStorage for unread status changes
        const lastSeenStatus = localStorage.getItem(`app_status_${user.id}`);
        if (application && lastSeenStatus && lastSeenStatus !== application.status) {
          setHasPendingNotification(true);
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      }
    };

    checkApplicationStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('application-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'influencer_applications'
        },
        () => {
          checkApplicationStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('influencer_applications')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (application) {
        localStorage.setItem(`app_status_${user.id}`, application.status);
      }
      setHasPendingNotification(false);
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  return { hasPendingNotification, clearNotification };
};
