import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConsentModal } from "./ConsentModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualVerificationReviewProps {
  verificationId: string;
  onComplete: () => void;
}

export const ManualVerificationReview = ({
  verificationId,
  onComplete
}: ManualVerificationReviewProps) => {
  const navigate = useNavigate();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [notes, setNotes] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    loadVerification();
  }, [verificationId]);

  const loadVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/login");
        return;
      }

      // Load verification request
      const { data, error } = await supabase
        .from('manual_verifications')
        .select('*, session_id, initiator_user_id, reviewer_user_id')
        .eq('id', verificationId)
        .single();

      if (error) throw error;

      // Verify user is the reviewer
      if (data.reviewer_user_id !== user.id) {
        toast.error("You are not authorized to review this verification");
        navigate("/feed");
        return;
      }

      // Check if already reviewed
      if (data.status !== 'pending') {
        toast.info("This verification has already been reviewed");
        onComplete();
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        toast.error("This verification request has expired");
        navigate("/feed");
        return;
      }

      setVerification(data);
    } catch (error: any) {
      console.error('Error loading verification:', error);
      toast.error(error.message || "Failed to load verification request");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!decision) {
      toast.error("Please select a decision (Approve or Reject)");
      return;
    }

    setShowConsentModal(true);
  };

  const handleConsentConfirmed = async () => {
    setShowConsentModal(false);
    setReviewing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call edge function to submit review
      const { data, error } = await supabase.functions.invoke('submit-manual-verification-review', {
        body: {
          verification_id: verificationId,
          decision: decision,
          notes: notes || null
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          decision === 'approved' 
            ? "Verification approved! The other party has been notified."
            : "Verification rejected. The other party has been notified."
        );

        // Update session status
        await supabase
          .from('vai_check_sessions')
          .update({ 
            status: decision === 'approved' ? 'manual_verified' : 'manual_rejected'
          })
          .eq('id', verification.session_id);

        onComplete();
      } else {
        throw new Error(data?.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const failureReasonLabels = {
    system_glitch: "System Glitch",
    cant_verify: "Cannot Verify",
    failed_check: "Failed Verification"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="border-2 border-primary/50 bg-primary/5">
        <Shield className="h-5 w-5 text-primary" />
        <AlertDescription>
          <div className="font-semibold mb-2">Manual Verification Request</div>
          <p className="text-sm">
            You have been requested to manually verify another user. Please compare their 
            VAI photo with their live selfie and make a decision.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Review Manual Verification
            </span>
            <Badge variant="outline">
              {failureReasonLabels[verification.failure_reason]}
            </Badge>
          </CardTitle>
          <CardDescription>
            Compare the photos below and determine if they match the same person.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Failure Reason */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-semibold mb-2 block">Failure Reason:</Label>
            <p className="text-sm text-muted-foreground mb-2">
              {verification.failure_details || failureReasonLabels[verification.failure_reason]}
            </p>
          </div>

          {/* Photos Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">VAI Verified Photo</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={verification.vai_photo_url} 
                  alt="VAI Photo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the photo used during VAI verification
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Live Selfie</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={verification.live_selfie_url} 
                  alt="Live Selfie" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the live photo captured during verification attempt
              </p>
            </div>
          </div>

          {/* Comparison Guidelines */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>What to look for:</strong>
              <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
                <li>Facial features (eyes, nose, mouth shape)</li>
                <li>Face structure and proportions</li>
                <li>Overall similarity</li>
                <li>Note: Lighting, angle, and expression may differ</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Decision */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Decision <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={decision === 'approved' ? 'default' : 'outline'}
                onClick={() => setDecision('approved')}
                className="h-20 flex flex-col gap-2"
                disabled={reviewing}
              >
                <CheckCircle className={`w-6 h-6 ${decision === 'approved' ? '' : 'text-muted-foreground'}`} />
                <span className="font-semibold">Approve</span>
                <span className="text-xs text-muted-foreground">Photos match</span>
              </Button>
              <Button
                variant={decision === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setDecision('rejected')}
                className="h-20 flex flex-col gap-2"
                disabled={reviewing}
              >
                <XCircle className={`w-6 h-6 ${decision === 'rejected' ? '' : 'text-muted-foreground'}`} />
                <span className="font-semibold">Reject</span>
                <span className="text-xs text-muted-foreground">Photos don't match</span>
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="review-notes">
              Review Notes (Optional)
            </Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional observations or notes about your decision..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length} / 500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/feed")}
              disabled={reviewing}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleReview}
              disabled={!decision || reviewing}
              className="flex-1"
            >
              {reviewing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consent Modal */}
      <ConsentModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConsentConfirmed}
        failureReason={verification.failure_reason}
        failureDetails={verification.failure_details}
        role="reviewer"
        loading={reviewing}
      />
    </div>
  );
};


