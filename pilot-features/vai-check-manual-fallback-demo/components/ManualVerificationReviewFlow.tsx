import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ManualVerificationWarningModal } from "./ManualVerificationWarningModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualVerificationReviewFlowProps {
  sessionId: string;
  onComplete: () => void;
}

export const ManualVerificationReviewFlow = ({
  sessionId,
  onComplete
}: ManualVerificationReviewFlowProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [notes, setNotes] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [userVAI, setUserVAI] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/login");
        return;
      }

      // Get user's VAI number
      const { data: vaiData } = await supabase
        .from('vai_verifications')
        .select('vai_number')
        .eq('user_id', user.id)
        .single();

      if (!vaiData) {
        toast.error("You must be VAI-verified to review manual verifications");
        navigate("/feed");
        return;
      }

      setUserVAI(vaiData.vai_number);

      // Load session
      const { data: sessionData, error } = await supabase
        .from('vai_check_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      // Verify user is the reviewer
      if (sessionData.manual_reviewer_vai_number !== vaiData.vai_number) {
        toast.error("You are not authorized to review this verification");
        navigate("/feed");
        return;
      }

      // Check if already reviewed
      if (sessionData.manual_review_decision !== 'pending') {
        toast.info("This verification has already been reviewed");
        onComplete();
        return;
      }

      // Check if consent already given
      if (!sessionData.reviewer_consent_timestamp) {
        // Show consent modal first
        setShowConsentModal(true);
      }

      setSession(sessionData);
    } catch (error: any) {
      console.error('Error loading session data:', error);
      toast.error(error.message || "Failed to load verification request");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentConfirmed = async () => {
    setShowConsentModal(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update session with reviewer consent
      await supabase
        .from('vai_check_sessions')
        .update({
          reviewer_consent_timestamp: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Create audit log
      await supabase
        .from('manual_verification_audit_log')
        .insert({
          session_id: sessionId,
          action: 'reviewer_consent_given',
          user_id: user.id,
          user_vai_number: userVAI,
          metadata: {
            liability_waiver_accepted: true
          }
        });

      // Reload session
      loadSessionData();
    } catch (error: any) {
      console.error('Error recording consent:', error);
      toast.error("Failed to record consent");
    }
  };

  const handleReview = async () => {
    if (!decision) {
      toast.error("Please select a decision (Approve or Reject)");
      return;
    }

    setReviewing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update session with review decision
      const { error: updateError } = await supabase
        .from('vai_check_sessions')
        .update({
          manual_review_decision: decision,
          manual_review_decided_at: new Date().toISOString(),
          manual_review_notes: notes || null,
          status: decision === 'approved' ? 'manual_review_approved' : 'manual_review_rejected'
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Create audit log
      await supabase
        .from('manual_verification_audit_log')
        .insert({
          session_id: sessionId,
          action: decision === 'approved' ? 'review_approved' : 'review_rejected',
          user_id: user.id,
          user_vai_number: userVAI,
          metadata: {
            decision,
            notes: notes || null
          }
        });

      toast.success(
        decision === 'approved' 
          ? "Verification approved! The other party has been notified."
          : "Verification rejected. The other party has been notified."
      );

      onComplete();
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

  if (!session) {
    return null;
  }

  const failureReasonLabels = {
    system_failure: "System Failure",
    individual_issue: "Individual Issue",
    failed_verification: "Failed Verification"
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
              {failureReasonLabels[session.manual_review_reason]}
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
              {session.manual_review_notes || failureReasonLabels[session.manual_review_reason]}
            </p>
          </div>

          {/* Photos Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">VAI Verified Photo</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={session.manual_review_vai_photo_url} 
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
                  src={session.manual_review_live_selfie_url} 
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
              disabled={!decision || reviewing || !session.reviewer_consent_timestamp}
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
      <ManualVerificationWarningModal
        open={showConsentModal}
        onClose={() => {
          setShowConsentModal(false);
          navigate("/feed");
        }}
        onConfirm={handleConsentConfirmed}
        failureReason={session.manual_review_reason}
        role="reviewer"
        loading={reviewing}
      />
    </div>
  );
};


