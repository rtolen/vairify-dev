import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Flag, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewList } from "@/components/reviews/ReviewList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TrueRevuDashboard() {
  const navigate = useNavigate();
  const [pendingDisputes, setPendingDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingDisputes();
  }, []);

  const loadPendingDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load disputes where user is a panel member
      const { data: disputes, error } = await supabase
        .from('dispute_panel_members')
        .select(`
          *,
          dispute:review_disputes(
            id,
            review_id,
            dispute_reason,
            status,
            created_at,
            review:reviews(notes, overall_rating)
          )
        `)
        .eq('panel_member_id', user.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingDisputes(disputes || []);
    } catch (error) {
      console.error('Error loading pending disputes:', error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">TrueRevu Dashboard</h1>
          <p className="text-sm text-muted-foreground">Review system and dispute resolution</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="disputes">
              <Flag className="w-4 h-4 mr-2" />
              Pending Disputes to Review
              {pendingDisputes.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingDisputes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <ReviewList />
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Pending Disputes to Review</CardTitle>
                <CardDescription>
                  You have been selected as a panel member for these disputes. Review the evidence and cast your vote.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading disputes...
                  </div>
                ) : pendingDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending disputes assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDisputes.map((panelMember) => {
                      const dispute = panelMember.dispute;
                      if (!dispute) return null;

                      return (
                        <Card key={panelMember.id} className="border-2">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">Dispute #{dispute.id.substring(0, 8)}</h3>
                                  <Badge variant="outline">{dispute.dispute_reason}</Badge>
                                  {panelMember.status === 'pending' && (
                                    <Badge variant="outline" className="bg-warning/10">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Invitation Pending
                                    </Badge>
                                  )}
                                  {panelMember.status === 'accepted' && (
                                    <Badge variant="outline" className="bg-success/10">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                                {dispute.review && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    Review: "{dispute.review.notes?.substring(0, 100)}..."
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Created: {new Date(dispute.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                onClick={() => navigate(`/truerevu/disputes/${dispute.id}`)}
                                variant="default"
                              >
                                Review Case
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

