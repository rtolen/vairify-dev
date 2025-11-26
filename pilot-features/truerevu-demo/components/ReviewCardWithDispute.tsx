import { Star, Shield, Calendar, Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisputeButton } from "./DisputeButton";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ReviewCardWithDisputeProps {
  review: {
    id: string;
    overall_rating: number;
    notes: string | null;
    reviewer_vai_number: string;
    created_at: string;
    punctuality_rating?: number | null;
    communication_rating?: number | null;
    respectfulness_rating?: number | null;
    attitude_rating?: number | null;
    accuracy_rating?: number | null;
    safety_rating?: number | null;
    is_verified: boolean;
    reviewed_user_id: string;
  };
  showDisputeButton?: boolean;
}

export const ReviewCardWithDispute = ({ review, showDisputeButton = true }: ReviewCardWithDisputeProps) => {
  const [canDispute, setCanDispute] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkCanDispute();
  }, [review]);

  const checkCanDispute = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanDispute(false);
        return;
      }

      setCurrentUserId(user.id);

      // User can dispute if:
      // 1. They are the reviewed user (review is about them)
      // 2. They haven't already filed a dispute for this review
      if (user.id === review.reviewed_user_id) {
        // Check if dispute already exists
        const { data: existingDispute } = await supabase
          .from('review_disputes')
          .select('id')
          .eq('review_id', review.id)
          .eq('complainant_id', user.id)
          .maybeSingle();

        setCanDispute(!existingDispute);
      } else {
        setCanDispute(false);
      }
    } catch (error) {
      console.error('Error checking dispute eligibility:', error);
      setCanDispute(false);
    }
  };

  const formatVAI = (vai: string) => {
    if (vai.length <= 8) return vai;
    return `${vai.substring(0, 4)}...${vai.substring(vai.length - 4)}`;
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-sm font-semibold ml-2">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const categoryRatings = [
    { label: "Punctuality", value: review.punctuality_rating },
    { label: "Communication", value: review.communication_rating },
    { label: "Respectfulness", value: review.respectfulness_rating },
    { label: "Attitude", value: review.attitude_rating },
    { label: "Accuracy", value: review.accuracy_rating },
    { label: "Safety", value: review.safety_rating },
  ].filter(cat => cat.value !== null && cat.value !== undefined);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {renderStarRating(review.overall_rating)}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3" />
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {review.is_verified && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-mono">
              VAI {formatVAI(review.reviewer_vai_number)}
            </Badge>
            {showDisputeButton && canDispute && (
              <DisputeButton
                reviewId={review.id}
                reviewText={review.notes || ""}
                reviewerVAI={review.reviewer_vai_number}
                reviewedUserId={review.reviewed_user_id}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.notes && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {review.notes}
          </p>
        )}
        
        {categoryRatings.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-4 border-t">
            {categoryRatings.map((category) => (
              <div key={category.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{category.label}:</span>
                <div className="flex items-center gap-1">
                  <Star className={`w-3 h-3 ${
                    category.value && category.value >= 3
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-none text-muted-foreground"
                  }`} />
                  <span className="font-semibold">{category.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


