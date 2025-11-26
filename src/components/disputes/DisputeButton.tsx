import { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisputeFormDialog } from "./DisputeFormDialog";

interface DisputeButtonProps {
  reviewId: string;
  reviewText: string;
  reviewerVAI: string;
  reviewedUserId: string;
}

export const DisputeButton = ({ reviewId, reviewText, reviewerVAI, reviewedUserId }: DisputeButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="text-xs"
      >
        <Flag className="w-3 h-3 mr-1" />
        Dispute this Review
      </Button>
      <DisputeFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        reviewId={reviewId}
        reviewText={reviewText}
        reviewerVAI={reviewerVAI}
        reviewedUserId={reviewedUserId}
      />
    </>
  );
};


