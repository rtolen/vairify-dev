import { useState } from "react";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  failureReason: 'system_glitch' | 'cant_verify' | 'failed_check';
  failureDetails?: string;
  role: 'initiator' | 'reviewer';
  loading?: boolean;
}

const failureReasonLabels = {
  system_glitch: "System Glitch",
  cant_verify: "Cannot Verify",
  failed_check: "Failed Verification"
};

const failureReasonDescriptions = {
  system_glitch: "A technical issue prevented automatic verification from working properly. This is not a security concern - your identity is still valid.",
  cant_verify: "The system cannot process your face scan at this time. This may be due to lighting conditions, camera issues, or temporary technical problems.",
  failed_check: "The automatic face verification did not match your stored photo. This could be due to changes in appearance, or the photos may not match."
};

export const ConsentModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  failureReason, 
  failureDetails,
  role,
  loading = false 
}: ConsentModalProps) => {
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleConfirm = () => {
    if (liabilityAccepted && understood) {
      onConfirm();
    }
  };

  const isInitiator = role === 'initiator';
  const isReviewer = role === 'reviewer';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-primary" />
            Manual Verification Consent
          </DialogTitle>
          <DialogDescription className="text-base">
            Please read and acknowledge the following before proceeding with manual verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Failure Reason */}
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">Verification Failure Reason:</div>
              <Badge variant="destructive" className="text-sm">
                {failureReasonLabels[failureReason]}
              </Badge>
              <p className="text-sm mt-2">
                {failureReasonDescriptions[failureReason]}
              </p>
              {failureDetails && (
                <p className="text-xs mt-2 italic">
                  Details: {failureDetails}
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* What This Means */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              What This Means
            </h3>
            {isInitiator && (
              <div className="space-y-2 text-sm">
                <p>• You are requesting manual verification by another VAI-verified user</p>
                <p>• Your VAI photo and live selfie will be sent to the other party for review</p>
                <p>• The reviewer will compare your photos and make a decision</p>
                <p>• This process may take several minutes</p>
              </div>
            )}
            {isReviewer && (
              <div className="space-y-2 text-sm">
                <p>• You have been requested to manually verify another user</p>
                <p>• You will review their VAI photo and live selfie</p>
                <p>• Compare the photos and decide if they match</p>
                <p>• Your decision will determine if verification proceeds</p>
              </div>
            )}
          </div>

          {/* Liability Waiver */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="w-5 h-5" />
              Liability Waiver & Terms
            </h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>By proceeding with manual verification, you acknowledge:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Manual verification is a fallback process when automatic verification fails</li>
                <li>Verification decisions are based on human review, which may have limitations</li>
                <li>You understand the reasons for manual verification as stated above</li>
                <li>You consent to sharing verification photos with the reviewing party</li>
                <li>All verification data is stored securely and used only for verification purposes</li>
                {isReviewer && (
                  <li>You will review photos honestly and make a fair assessment</li>
                )}
              </ul>
              <p className="mt-2">
                <strong>Liability:</strong> Vairify is not liable for decisions made during manual verification. 
                The reviewing party acts as an independent verifier, and their decision is final.
              </p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="understood" className="text-sm cursor-pointer leading-relaxed">
                I understand why manual verification is needed and what the process entails.
                I have read and understood the failure reason: <strong>{failureReasonLabels[failureReason]}</strong>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="liability"
                checked={liabilityAccepted}
                onCheckedChange={(checked) => setLiabilityAccepted(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="liability" className="text-sm cursor-pointer leading-relaxed">
                I accept the liability waiver and terms of manual verification. I understand 
                that Vairify is not liable for manual verification decisions.
              </Label>
            </div>
          </div>

          {/* Warning */}
          <Alert className="border-primary/50 bg-primary/5">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Manual verification is a security-sensitive process. Only proceed if you 
              understand and accept the terms above.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!liabilityAccepted || !understood || loading}
            className="min-w-[150px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isInitiator ? 'Request Manual Verification' : 'Proceed to Review'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


