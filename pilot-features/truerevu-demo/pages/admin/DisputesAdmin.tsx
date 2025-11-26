import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Filter, CheckCircle, XCircle, Minus, AlertTriangle, Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function DisputesAdmin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadDisputes();
    }
  }, [isAdmin, statusFilter]);

  const loadDisputes = async () => {
    try {
      let query = supabase
        .from('review_disputes')
        .select(`
          *,
          review:reviews(notes, overall_rating),
          vote_tally:dispute_vote_tallies(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionAction) {
      toast.error("Please select a resolution action");
      return;
    }

    try {
      await supabase
        .from('review_disputes')
        .update({
          status: 'resolved',
          resolution_action: resolutionAction,
          resolution_notes: resolutionNotes || null,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);

      // If action is to remove review, delete it
      if (resolutionAction === 'review_removed') {
        await supabase
          .from('reviews')
          .delete()
          .eq('id', selectedDispute.review_id);
      }

      // TODO: Send outcome notifications to both parties

      toast.success("Dispute resolved successfully");
      setShowResolutionDialog(false);
      setSelectedDispute(null);
      setResolutionAction("");
      setResolutionNotes("");
      loadDisputes();
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      toast.error(error.message || "Failed to resolve dispute");
    }
  };

  const handleDismiss = async (disputeId: string) => {
    try {
      await supabase
        .from('review_disputes')
        .update({
          status: 'dismissed',
          resolution_action: 'dismissed',
          resolved_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      toast.success("Dispute dismissed");
      loadDisputes();
    } catch (error: any) {
      console.error('Error dismissing dispute:', error);
      toast.error(error.message || "Failed to dismiss dispute");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="bg-muted"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      case 'voting':
        return <Badge variant="outline" className="bg-primary/10 text-primary">Voting</Badge>;
      case 'panel_review':
        return <Badge variant="outline" className="bg-warning/10 text-warning">Panel Review</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Dispute Resolution Management
            </h1>
            <p className="text-sm text-muted-foreground">Review and resolve TrueRevu disputes</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_panel">Pending Panel</SelectItem>
                  <SelectItem value="panel_review">Panel Review</SelectItem>
                  <SelectItem value="voting">Voting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Disputes List */}
        <Card>
          <CardHeader>
            <CardTitle>All Disputes ({disputes.length})</CardTitle>
            <CardDescription>Review vote tallies and take resolution actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disputes.map((dispute) => {
                const tally = dispute.vote_tally?.[0];
                return (
                  <Card key={dispute.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Dispute #{dispute.id.substring(0, 8)}</h3>
                            {getStatusBadge(dispute.status)}
                            <Badge variant="outline">{dispute.dispute_reason}</Badge>
                          </div>
                          
                          {dispute.review && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Review: "{dispute.review.notes?.substring(0, 100)}..."</p>
                              <p className="text-muted-foreground">Rating: {dispute.review.overall_rating}/5.0</p>
                            </div>
                          )}

                          {tally && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                              <div>
                                <p className="text-xs text-muted-foreground">Favor Complainant</p>
                                <p className="text-lg font-bold text-success">{tally.favor_complainant_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Favor Respondent</p>
                                <p className="text-lg font-bold text-destructive">{tally.favor_respondent_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">No Decision</p>
                                <p className="text-lg font-bold text-muted-foreground">{tally.no_decision_count || 0}</p>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(dispute.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {dispute.status === 'voting' && (
                            <Button
                              variant="default"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowResolutionDialog(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                          {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && (
                            <Button
                              variant="outline"
                              onClick={() => handleDismiss(dispute.id)}
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review vote tallies and select a resolution action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDispute?.vote_tally?.[0] && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Favor Complainant</p>
                  <p className="text-2xl font-bold text-success">
                    {selectedDispute.vote_tally[0].favor_complainant_count || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Favor Respondent</p>
                  <p className="text-2xl font-bold text-destructive">
                    {selectedDispute.vote_tally[0].favor_respondent_count || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">No Decision</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {selectedDispute.vote_tally[0].no_decision_count || 0}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Resolution Action <span className="text-destructive">*</span></Label>
              <Select value={resolutionAction} onValueChange={setResolutionAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review_removed">
                    <Trash2 className="w-4 h-4 mr-2 inline" />
                    Remove Review
                  </SelectItem>
                  <SelectItem value="warning_issued">
                    <Ban className="w-4 h-4 mr-2 inline" />
                    Issue Warning
                  </SelectItem>
                  <SelectItem value="no_action">
                    <CheckCircle className="w-4 h-4 mr-2 inline" />
                    No Action (Review Stays)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution Notes (Optional)</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about the resolution decision..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolutionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionAction}>
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


