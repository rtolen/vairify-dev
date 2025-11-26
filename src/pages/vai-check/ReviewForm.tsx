import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ReviewForm() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  const [ratings, setRatings] = useState({
    punctuality: 0,
    communication: 0,
    respectfulness: 0,
    attitude: 0,
    accuracy: 0,
    safety: 0,
  });
  
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [encounter, setEncounter] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [reviewerVAI, setReviewerVAI] = useState<string | null>(null);
  const [revieweeVAI, setRevieweeVAI] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit a review");
        navigate("/login");
        return;
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('vai_check_sessions')
        .select('provider_id, client_id, status, encounter_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast.error("Session not found");
        navigate("/feed");
        return;
      }

      setSession(sessionData);

      // Get encounter if exists
      if (sessionData.encounter_id) {
        const { data: encounterData, error: encounterError } = await supabase
          .from('encounters')
          .select('*')
          .eq('id', sessionData.encounter_id)
          .single();

        if (!encounterError && encounterData) {
          setEncounter(encounterData);

          // Determine reviewer and reviewee
          const isProvider = user.id === sessionData.provider_id;
          const reviewedUserId = isProvider ? sessionData.client_id : sessionData.provider_id;

          // Get VAI numbers
          const reviewerVAIData = await supabase
            .from('vai_verifications')
            .select('vai_number')
            .eq('user_id', user.id)
            .single();

          const revieweeVAIData = await supabase
            .from('vai_verifications')
            .select('vai_number')
            .eq('user_id', reviewedUserId)
            .single();

          if (reviewerVAIData.data) {
            setReviewerVAI(reviewerVAIData.data.vai_number);
          }

          if (revieweeVAIData.data) {
            setRevieweeVAI(revieweeVAIData.data.vai_number);
          }

          // Check if can submit review (mutual verification)
          const { data: canSubmitData } = await supabase
            .rpc('can_submit_review', {
              p_encounter_id: encounterData.id,
              p_reviewer_id: user.id
            });

          setCanSubmit(canSubmitData || false);
        }
      } else {
        toast.error("Encounter not found. Please complete VAI Check first.");
        navigate("/vai-check");
        return;
      }
    } catch (error: any) {
      console.error('Error loading session data:', error);
      toast.error(error.message || "Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: "punctuality", label: "⏰ Punctuality", icon: "⏰" },
    { key: "communication", label: "💬 Communication", icon: "💬" },
    { key: "respectfulness", label: "🤝 Respectfulness", icon: "🤝" },
    { key: "attitude", label: "😊 Attitude", icon: "😊" },
    { key: "accuracy", label: "✅ Accuracy", icon: "✅" },
    { key: "safety", label: "🛡️ Safety", icon: "🛡️" },
  ];

  const calculateOverall = () => {
    const ratedCategories = Object.values(ratings).filter(r => r > 0);
    if (ratedCategories.length === 0) return null;
    const sum = ratedCategories.reduce((acc, val) => acc + val, 0);
    return (sum / ratedCategories.length).toFixed(1);
  };

  const handleStarClick = (category: string, star: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === star ? 0 : star
    }));
  };

  const renderStars = (category: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(category, star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-white/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error("Please confirm your review is honest");
      return;
    }

    const overall = calculateOverall();
    if (!overall) {
      toast.error("Please rate at least one category");
      return;
    }

    if (!canSubmit) {
      toast.error("You cannot submit a review yet. Both parties must complete the encounter first.");
      return;
    }

    if (!encounter || !session || !reviewerVAI || !revieweeVAI) {
      toast.error("Missing required data. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit a review");
        return;
      }

      // Determine reviewed user ID
      const isProvider = user.id === session.provider_id;
      const reviewedUserId = isProvider ? session.client_id : session.provider_id;

      if (!reviewedUserId) {
        toast.error("Cannot determine reviewed user");
        return;
      }

      // Call edge function to submit review (with mutual verification check)
      const { data, error } = await supabase.functions.invoke('submit-review', {
        body: {
          encounter_id: encounter.id,
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          reviewer_vai_number: reviewerVAI,
          reviewee_vai_number: revieweeVAI,
          punctuality_rating: ratings.punctuality || null,
          communication_rating: ratings.communication || null,
          respectfulness_rating: ratings.respectfulness || null,
          attitude_rating: ratings.attitude || null,
          accuracy_rating: ratings.accuracy || null,
          safety_rating: ratings.safety || null,
          overall_rating: parseFloat(overall),
          review_text: notes,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Review submitted successfully!");
        navigate("/feed");
      } else {
        throw new Error(data?.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const overall = calculateOverall();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <p>Loading review form...</p>
        </div>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
        <header className="sticky top-0 bg-[#0A1628]/95 backdrop-blur-sm border-b border-white/10 px-4 py-4 z-10">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">TrueRevu Review</h1>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 max-w-md mx-auto">
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <AlertDescription className="text-white">
              <div className="font-semibold mb-2">Review Not Available Yet</div>
              <p className="text-sm text-white/80">
                Both parties must complete the encounter before reviews can be submitted. 
                This ensures authentic, mutual reviews.
              </p>
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate("/feed")}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-cyan-600"
          >
            Return to Feed
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <header className="sticky top-0 bg-[#0A1628]/95 backdrop-blur-sm border-b border-white/10 px-4 py-4 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">TrueRevu Review</h1>
            <p className="text-xs text-white/60">Share your verified experience</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6 pb-24">
        {/* Verified Badge */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div>
            <p className="font-semibold">Verified Encounter</p>
            <p className="text-xs text-white/60">Reviewing: VAI {revieweeVAI?.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Rating Categories */}
        <div className="bg-white/5 rounded-xl p-6 space-y-4 border border-white/10">
          <h2 className="font-bold text-lg mb-4">Rate Your Experience</h2>
          {categories.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <Label className="text-white flex items-center gap-2 cursor-pointer">
                <span>{category.icon}</span>
                {category.label}
              </Label>
              {renderStars(category.key, ratings[category.key as keyof typeof ratings])}
            </div>
          ))}
          
          {overall && (
            <div className="pt-4 border-t border-white/10 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{overall}</span>
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <Label htmlFor="notes" className="text-white font-semibold mb-2 block">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share details about your experience..."
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
            maxLength={1000}
          />
          <p className="text-xs text-white/40 mt-2">{notes.length} / 1000 characters</p>
        </div>

        {/* Confirmation */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirmed"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="confirmed" className="text-white cursor-pointer">
              I confirm this review is honest and based on my actual verified encounter. 
              I understand this review cannot be edited or deleted after submission.
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!confirmed || !overall || submitting}
          className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold"
        >
          {submitting ? "Submitting Review..." : "Submit Review"}
        </Button>

        <p className="text-xs text-center text-white/40">
          Reviews are immutable once submitted to ensure authenticity
        </p>
      </main>
    </div>
  );
}
