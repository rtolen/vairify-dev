import { useParams, useNavigate } from "react-router-dom";
import { ManualVerificationReview } from "../components/ManualVerificationReview";

export default function ManualVerificationPage() {
  const { verificationId } = useParams();
  const navigate = useNavigate();

  if (!verificationId) {
    navigate("/feed");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-32 md:pb-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ManualVerificationReview
            verificationId={verificationId}
            onComplete={() => navigate("/feed")}
          />
        </div>
      </div>
    </div>
  );
}


