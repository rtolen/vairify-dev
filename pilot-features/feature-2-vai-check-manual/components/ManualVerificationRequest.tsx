import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Camera, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConsentModal } from "./ConsentModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManualVerificationRequestProps {
  sessionId: string;
  capturedSelfie: string;
  vaiPhotoUrl: string;
  onComplete: () => void;
}

export const ManualVerificationRequest = ({
  sessionId,
  capturedSelfie,
  vaiPhotoUrl,
  onComplete
}: ManualVerificationRequestProps) => {
  const navigate = useNavigate();
  const [failureReason, setFailureReason] = useState<'system_glitch' | 'cant_verify' | 'failed_check'>('cant_verify');
  const [failureDetails, setFailureDetails] = useState("");
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleRequestManualVerification = async () => {
    if (!failureReason) {
      toast.error("Please select a failure reason");
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

      // Get session to find the other party
      const { data: session, error: sessionError } = await supabase
        .from('vai_check_sessions')
        .select('provider_id, client_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error("Session not found");
      }

      // Determine reviewer (other party)
      const reviewerId = session.provider_id === user.id 
        ? session.client_id 
        : session.provider_id;

      if (!reviewerId) {
        throw new Error("Other party not found");
      }

      // Check reviewer is VAI-verified
      const { data: reviewerVAI } = await supabase
        .from('vai_verifications')
        .select('user_id')
        .eq('user_id', reviewerId)
        .single();

      if (!reviewerVAI) {
        toast.error("The other party must be VAI-verified to review manual verifications");
        return;
      }

      // Call edge function to initiate manual verification
      const { data, error } = await supabase.functions.invoke('initiate-manual-verification', {
        body: {
          session_id: sessionId,
          failure_reason: failureReason,
          failure_details: failureDetails || null,
          vai_photo_url: vaiPhotoUrl,
          live_selfie_url: capturedSelfie,
          reviewer_user_id: reviewerId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Manual verification request sent! The other party will be notified.");
        
        // Update session with manual verification ID
        await supabase
          .from('vai_check_sessions')
          .update({ 
            manual_verification_id: data.verification_id,
            status: 'manual_review_pending'
          })
          .eq('id', sessionId);

        onComplete();
      } else {
        throw new Error(data?.error || 'Failed to initiate manual verification');
      }
    } catch (error: any) {
      console.error('Error requesting manual verification:', error);
      toast.error(error.message || "Failed to request manual verification");
    } finally {
      setRequesting(false);
    }
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
            Provide details about why automatic verification failed. The other party will review 
            your photos and make a verification decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Failure Reason */}
          <div className="space-y-2">
            <Label htmlFor="failure-reason" className="text-base">
              Failure Reason <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={failureReason} 
              onValueChange={(value: 'system_glitch' | 'cant_verify' | 'failed_check') => setFailureReason(value)}
            >
              <SelectTrigger id="failure-reason">
                <SelectValue placeholder="Select failure reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system_glitch">
                  System Glitch - Technical issue prevented verification
                </SelectItem>
                <SelectItem value="cant_verify">
                  Cannot Verify - System cannot process face scan
                </SelectItem>
                <SelectItem value="failed_check">
                  Failed Check - Face scan did not match stored photo
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the reason that best describes why automatic verification failed.
            </p>
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
                <li>Your photos will be sent to the other party</li>
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
              onClick={() => navigate(-1)}
              disabled={requesting}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={handleRequestManualVerification}
              disabled={requesting || !failureReason}
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
      <ConsentModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConsentConfirmed}
        failureReason={failureReason}
        failureDetails={failureDetails}
        role="initiator"
        loading={requesting}
      />
    </div>
  );
};


