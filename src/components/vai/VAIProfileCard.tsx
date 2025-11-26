import { Shield, Calendar, CheckCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { VAIStatusBadge } from "./VAIStatusBadge";

interface VAIProfileCardProps {
  vaiNumber?: string;
  verifiedAt?: string;
  biometricPhotoUrl?: string;
  isVerified: boolean;
  onViewDetails?: () => void;
  onStartVerification?: () => void;
}

export const VAIProfileCard = ({
  vaiNumber,
  verifiedAt,
  biometricPhotoUrl,
  isVerified,
  onViewDetails,
  onStartVerification
}: VAIProfileCardProps) => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          V.A.I. Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <VAIStatusBadge 
            isVerified={isVerified} 
            vaiNumber={vaiNumber}
            size="lg"
          />
        </div>

        {isVerified && vaiNumber ? (
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">V.A.I. Number</span>
                <span className="font-mono font-semibold">{vaiNumber}</span>
              </div>
              {verifiedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verified On</span>
                  <span className="text-sm">{format(new Date(verifiedAt), "MMM dd, yyyy")}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Identity Verified</p>
                <p className="text-muted-foreground text-xs">
                  Your identity has been verified through secure biometric verification
                </p>
              </div>
            </div>

            {onViewDetails && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onViewDetails}
              >
                View Full Details
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Complete V.A.I. verification to unlock premium features, build trust with the community, 
                and access exclusive services.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Secure biometric verification</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Anonymous identity protection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Verified badge on profile</span>
              </div>
            </div>

            {onStartVerification && (
              <Button 
                className="w-full"
                onClick={onStartVerification}
              >
                <Shield className="w-4 h-4 mr-2" />
                Start V.A.I. Verification
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
