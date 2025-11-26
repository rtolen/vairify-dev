import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Image, MessageSquare, CheckCircle, XCircle, Minus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PanelDisputeReview() {
  const { disputeId } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [panelMember, setPanelMember] = useState<any>(null);

  useEffect(() => {
    loadDisputeData();
  }, [disputeId]);

  const loadDisputeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Load dispute
      const { data: disputeData, error: disputeError } = await supabase
        .from('review_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (disputeError || !disputeData) {
        toast.error("Dispute not found");
        navigate("/truerevu");
        return;
      }

      setDispute(disputeData);

      // Load review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', disputeData.review_id)
        .single();

      if (!reviewError && reviewData) {
        setReview(reviewData);
      }

      // Check if user is panel member
      const { data: memberData, error: memberError } = await supabase
        .from('dispute_panel_members')
        .select('*')
        .eq('dispute_id', disputeId)
        .eq('panel_member_id', user.id)
        .single();

      if (memberError || !memberData) {
        toast.error("You are not a panel member for this dispute");
        navigate("/truerevu");
        return;
      }

      setPanelMember(memberData);

      // Accept invitation if pending
      if (memberData.status === 'pending') {
        await supabase
          .from('dispute_panel_members')
          .update({
            status: 'accepted',
            invitation_accepted_at: new Date().toISOString()
          })
          .eq('id', memberData.id);
      }

      // Check if user has voted
      const { data: voteData } = await supabase
        .from('dispute_votes')
        .select('id')
        .eq('dispute_id', disputeId)
        .eq('panel_member_id', user.id)
        .maybeSingle();

      setHasVoted(!!voteData);
    } catch (error) {
      console.error('Error loading dispute data:', error);
      toast.error("Failed to load dispute");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (decision: 'favor_complainant' | 'favor_respondent' | 'no_decision') => {
    if (!disputeId) return;

    setVoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('record-dispute-vote', {
        body: {
          dispute_id: disputeId,
          vote_decision: decision
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Vote recorded successfully!");
        setHasVoted(true);
      } else {
        throw new Error(data?.error || 'Failed to record vote');
      }
    } catch (error: any) {
      console.error('Error recording vote:', error);
      toast.error(error.message || "Failed to record vote");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dispute || !review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Dispute not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/truerevu")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Dispute Review Panel</h1>
            <p className="text-sm text-muted-foreground">Review case evidence and cast your vote</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Alert */}
        {hasVoted ? (
          <Alert className="border-success/50 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              You have already cast your vote. Thank you for your participation!
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please review all evidence carefully before casting your vote. Your decision is final.
            </AlertDescription>
          </Alert>
        )}

        {/* Review in Question */}
        <Card>
          <CardHeader>
            <CardTitle>Review in Question</CardTitle>
            <CardDescription>The review that is being disputed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{review.overall_rating}</span>
                <span className="text-muted-foreground">/ 5.0</span>
              </div>
            </div>
            {review.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Review Text</p>
                <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                  {review.notes}
                </p>
              </div>
            )}
            <div>
              <Badge variant="outline">Dispute Reason: {dispute.dispute_reason}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Complainant Statement */}
        <Card>
          <CardHeader>
            <CardTitle>Complainant's Statement</CardTitle>
            <CardDescription>Why this review should be disputed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {dispute.statement}
            </p>
          </CardContent>
        </Card>

        {/* Evidence */}
        {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Evidence
              </CardTitle>
              <CardDescription>Supporting documents and images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {dispute.evidence_urls.map((url: string, index: number) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="p-8 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DM Attachments */}
        {dispute.dm_attachments && dispute.dm_attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Relevant Direct Messages
              </CardTitle>
              <CardDescription>Conversation history between parties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dispute.dm_attachments.map((dm: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(dm.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm">{dm.preview}...</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Section */}
        {!hasVoted && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>Your decision is final and cannot be changed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button
                  onClick={() => handleVote('favor_complainant')}
                  disabled={voting}
                  className="h-auto py-4 justify-start"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div className="text-left">
                      <div className="font-semibold">Favor Complainant</div>
                      <div className="text-xs text-muted-foreground">
                        The review should be removed or modified
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleVote('favor_respondent')}
                  disabled={voting}
                  className="h-auto py-4 justify-start"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <div className="text-left">
                      <div className="font-semibold">Favor Respondent</div>
                      <div className="text-xs text-muted-foreground">
                        The review is valid and should remain
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleVote('no_decision')}
                  disabled={voting}
                  className="h-auto py-4 justify-start"
                  variant="outline"
                >
                  <div className="flex items-center gap-3">
                    <Minus className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-semibold">No Decision</div>
                      <div className="text-xs text-muted-foreground">
                        Insufficient evidence to make a determination
                      </div>
                    </div>
                  </div>
                </Button>
              </div>

              {voting && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording your vote...
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


