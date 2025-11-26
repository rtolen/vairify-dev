import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { supabase } from "@/integrations/supabase/client";

interface ReviewListProps {
  userId?: string;
  encounterId?: string;
  limit?: number;
}

export const ReviewList = ({ userId, encounterId, limit = 10 }: ReviewListProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [userId, encounterId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('reviews')
        .select('*')
        .eq('submitted', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('reviewed_user_id', userId);
      }

      if (encounterId) {
        query = query.eq('encounter_id', encounterId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setReviews(data || []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      setError(error.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Error loading reviews: {error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
};


