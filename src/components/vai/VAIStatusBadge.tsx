import { Shield, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VAIStatusBadgeProps {
  isVerified: boolean;
  vaiNumber?: string;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export const VAIStatusBadge = ({ 
  isVerified, 
  vaiNumber, 
  size = "md",
  showNumber = true 
}: VAIStatusBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  if (!isVerified) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className={`${sizeClasses[size]} flex items-center gap-2`}>
              <AlertCircle size={iconSizes[size]} />
              <span>Not Verified</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>This user has not completed V.A.I. verification</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="default" 
            className={`${sizeClasses[size]} flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow`}
          >
            <Shield size={iconSizes[size]} className="fill-current" />
            <span className="font-semibold">V.A.I. VERIFIED</span>
            {showNumber && vaiNumber && (
              <span className="ml-1 opacity-90">#{vaiNumber}</span>
            )}
            <CheckCircle size={iconSizes[size]} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Verified Anonymous Identity</p>
            {vaiNumber && <p className="text-xs">V.A.I. Number: {vaiNumber}</p>}
            <p className="text-xs text-muted-foreground">
              This user has completed identity verification
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
