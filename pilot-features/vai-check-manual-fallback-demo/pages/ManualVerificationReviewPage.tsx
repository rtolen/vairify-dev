import { useParams, useNavigate } from "react-router-dom";
import { ManualVerificationReviewFlow } from "../components/ManualVerificationReviewFlow";

export default function ManualVerificationReviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  if (!sessionId) {
    navigate("/feed");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ManualVerificationReviewFlow
            sessionId={sessionId}
            onComplete={() => navigate("/feed")}
          />
        </div>
      </div>
    </div>
  );
}


