import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VAIStatus {
  isVerified: boolean;
  vaiNumber?: string;
  verifiedAt?: string;
  loading: boolean;
}

export const useVAIStatus = (userId?: string) => {
  const [status, setStatus] = useState<VAIStatus>({
    isVerified: false,
    loading: true
  });

  useEffect(() => {
    loadVAIStatus();
  }, [userId]);

  const loadVAIStatus = async () => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!targetUserId) {
        setStatus({ isVerified: false, loading: false });
        return;
      }

      const { data } = await supabase
        .from("vai_verifications")
        .select("vai_number, created_at")
        .eq("user_id", targetUserId)
        .single();

      setStatus({
        isVerified: !!data,
        vaiNumber: data?.vai_number,
        verifiedAt: data?.created_at,
        loading: false
      });
    } catch (error) {
      console.error("Error loading V.A.I. status:", error);
      setStatus({ isVerified: false, loading: false });
    }
  };

  return { ...status, refresh: loadVAIStatus };
};
