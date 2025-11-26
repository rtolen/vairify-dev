import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Camera, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ManualVerificationWarningModal } from "./ManualVerificationWarningModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualVerificationRequestFlowProps {
  sessionId: string;
  capturedSelfie: string;
  vaiPhotoUrl: string;
  failureReason: 'system_failure' | 'individual_issue' | 'failed_verification';
  onComplete: () => void;
  onCancel: () => void;
}

export const ManualVerificationRequestFlow = ({
  sessionId,
  capturedSelfie,
  vaiPhotoUrl,
  failureReason,
  onComplete,
  onCancel
}: ManualVerificationRequestFlowProps) => {
  const navigate = useNavigate();
  const [failureDetails, setFailureDetails] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [reviewerVAI, setReviewerVAI] = useState<string | null>(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load session
      const { data: sessionData, error } = await supabase
        .from('vai_check_sessions')
        .select('provider_id, client_id')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(sessionData);

      // Determine reviewer (other party)
      const reviewerId = sessionData.provider_id === user.id 
        ? sessionData.client_id 
        : sessionData.provider_id;

      if (!reviewerId) {
        toast.error("Other party not found in session");
        return;
      }

      // Get reviewer's VAI number
      const { data: vaiData } = await supabase
        .from('vai_verifications')
        .select('vai_number')
        .eq('user_id', reviewerId)
        .single();

      if (!vaiData) {
        toast.error("The other party must be VAI-verified to review manual verifications");
        return;
      }

      setReviewerVAI(vaiData.vai_number);
    } catch (error: any) {
      console.error('Error loading session data:', error);
      toast.error(error.message || "Failed to load session data");
    }
  };

  const handleRequestManualVerification = () => {
    if (!reviewerVAI) {
      toast.error("Reviewer VAI number not found");
      return;
    }
    setShowConsentModal(true);
  };

  const handleConsentConfirmed = async () => {
    setShowConsentModal(false);
    setRequesting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get user's VAI number for audit log
      const { data: userVAI } = await supabase
        .from('vai_verifications')
        .select('vai_number')
        .eq('user_id', user.id)
        .single();

      // Update session with manual verification request
      const { error: updateError } = await supabase
        .from('vai_check_sessions')
        .update({
          verification_method: 'manual_fallback',
          manual_review_reason: failureReason,
          manual_reviewer_vai_number: reviewerVAI,
          manual_review_vai_photo_url: vaiPhotoUrl,
          manual_review_live_selfie_url: capturedSelfie,
          manual_review_notes: failureDetails || null,
          owner_consent_timestamp: new Date().toISOString(),
          liability_waiver_accepted: true,
          status: 'manual_review_pending',
          manual_review_decision: 'pending'
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Create audit log entry
      await supabase
        .from('manual_verification_audit_log')
        .insert({
          session_id: sessionId,
          action: 'manual_review_requested',
          user_id: user.id,
          user_vai_number: userVAI?.vai_number || null,
          metadata: {
            failure_reason: failureReason,
            failure_details: failureDetails,
            reviewer_vai: reviewerVAI
          }
        });

      // Create owner consent audit log
      await supabase
        .from('manual_verification_audit_log')
        .insert({
          session_id: sessionId,
          action: 'owner_consent_given',
          user_id: user.id,
          user_vai_number: userVAI?.vai_number || null,
          metadata: {
            liability_waiver_accepted: true
          }
        });

      toast.success("Manual verification request sent! The other party will be notified.");
      onComplete();
    } catch (error: any) {
      console.error('Error requesting manual verification:', error);
      toast.error(error.message || "Failed to request manual verification");
    } finally {
      setRequesting(false);
    }
  };

  const failureReasonLabels = {
    system_failure: "System Failure",
    individual_issue: "Individual Issue",
    failed_verification: "Failed Verification"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="border-2 border-primary/50 bg-primary/5">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <AlertDescription>
          <div className="font-semibold mb-2">Automatic Verification Failed</div>
          <p className="text-sm">
            Your face scan could not be automatically verified. You can request manual verification 
            by another VAI-verified user, or try again.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Request Manual Verification
          </CardTitle>
          <CardDescription>
            Provide details about why automatic verification failed. The other party ({reviewerVAI || 'VAI-verified user'}) 
            will review your photos and make a verification decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Failure Reason Display */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-semibold mb-2 block">Failure Reason:</Label>
            <Badge variant="outline" className="text-sm">
              {failureReasonLabels[failureReason]}
            </Badge>
          </div>

          {/* Failure Details */}
          <div className="space-y-2">
            <Label htmlFor="failure-details">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="failure-details"
              value={failureDetails}
              onChange={(e) => setFailureDetails(e.target.value)}
              placeholder="E.g., 'Poor lighting conditions' or 'Camera not focusing properly'"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {failureDetails.length} / 500 characters
            </p>
          </div>

          {/* Photos Preview */}
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">VAI Photo</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={vaiPhotoUrl} 
                  alt="VAI Photo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Live Selfie</Label>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={capturedSelfie} 
                  alt="Live Selfie" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>What happens next:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                <li>Your photos will be sent to the other party (VAI: {reviewerVAI || 'Loading...'})</li>
                <li>They will review and compare your photos</li>
                <li>They will approve or reject your verification</li>
                <li>You'll be notified of their decision</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={requesting}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={handleRequestManualVerification}
              disabled={requesting || !reviewerVAI}
              className="flex-1"
            >
              {requesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Request Manual Verification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consent Modal */}
      <ManualVerificationWarningModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConsentConfirmed}
        failureReason={failureReason}
        role="owner"
        loading={requesting}
      />
    </div>
  );
};


