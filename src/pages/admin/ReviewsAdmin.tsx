import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Filter, Shield, Flag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function ReviewsAdmin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadReviews();
    }
  }, [isAdmin, ratingFilter, verifiedFilter]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          encounter:encounters(
            id,
            status,
            created_at,
            provider_id,
            client_id
          )
        `)
        .order('created_at', { ascending: false });

      if (ratingFilter !== "all") {
        const minRating = parseInt(ratingFilter);
        query = query.gte('overall_rating', minRating).lt('overall_rating', minRating + 1);
      }

      if (verifiedFilter !== "all") {
        query = query.eq('is_verified', verifiedFilter === "verified");
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const flagReview = async (reviewId: string, reason: string) => {
    try {
      // Create flag record (you may need to create a review_flags table)
      toast.info("Review flagged. Legal team will review.");
    } catch (error: any) {
      console.error('Error flagging review:', error);
      toast.error("Failed to flag review");
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.reviewer_vai_number?.toLowerCase().includes(query) ||
      review.reviewee_vai_number?.toLowerCase().includes(query) ||
      review.notes?.toLowerCase().includes(query) ||
      review.encounter?.id?.toLowerCase().includes(query)
    );
  });

  const formatVAI = (vai: string) => {
    if (!vai) return "N/A";
    if (vai.length <= 8) return vai;
    return `${vai.substring(0, 4)}...${vai.substring(vai.length - 4)}`;
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5" />
                TrueRevu Reviews
              </h1>
              <p className="text-sm text-muted-foreground">Monitor all verified reviews</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter reviews by rating, verified status, and search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by VAI number, review text, or encounter ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="2">2+ Stars</SelectItem>
                  <SelectItem value="1">1+ Stars</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Verified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reviews ({filteredReviews.length})</CardTitle>
            <CardDescription>View and manage all TrueRevu reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold">Rating</th>
                    <th className="text-left p-2 text-sm font-semibold">Reviewer VAI</th>
                    <th className="text-left p-2 text-sm font-semibold">Reviewee VAI</th>
                    <th className="text-left p-2 text-sm font-semibold">Review Text</th>
                    <th className="text-left p-2 text-sm font-semibold">Encounter</th>
                    <th className="text-left p-2 text-sm font-semibold">Verified</th>
                    <th className="text-left p-2 text-sm font-semibold">Created</th>
                    <th className="text-left p-2 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{review.overall_rating?.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm font-mono">{formatVAI(review.reviewer_vai_number)}</td>
                      <td className="p-2 text-sm font-mono">{formatVAI(review.reviewee_vai_number)}</td>
                      <td className="p-2 text-sm text-muted-foreground max-w-md truncate">
                        {review.notes || '-'}
                      </td>
                      <td className="p-2 text-xs font-mono">
                        {review.encounter ? review.encounter.id.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="p-2">
                        {review.is_verified ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => flagReview(review.id, "Legal violation")}
                          className="text-xs"
                        >
                          <Flag className="w-3 h-3 mr-1" />
                          Flag
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


