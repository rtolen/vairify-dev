import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReferralLeaderboard() {
  const navigate = useNavigate();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_leaderboard")
        .select("*");

      if (error) throw error;
      return data || [];
    },
  });

  const { data: activeCompetitions } = useQuery({
    queryKey: ["active-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_representative_competitions")
        .select("*")
        .eq("status", "active")
        .order("competition_end_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/referrals")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Referral Leaderboard</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Active Competitions Info */}
        {activeCompetitions && activeCompetitions.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Active Country Competitions
            </h3>
            <div className="space-y-3">
              {activeCompetitions.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{comp.country_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ends: {format(new Date(comp.competition_end_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top 3 Highlight */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((user, index) => (
              <Card
                key={user.user_id}
                className="p-6 text-center relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  {getRankIcon(index)}
                </div>
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.display_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg mb-1">{user.display_name}</h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {user.total_referrals}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Referrals
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {user.provider_referrals} provider referrals
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">All Referrers</h3>
          </div>
          <div className="divide-y divide-border">
            {leaderboard?.map((user, index) => (
              <div
                key={user.user_id}
                className="p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 text-center font-semibold text-muted-foreground">
                    #{index + 1}
                  </div>
                  {index < 3 && (
                    <div className="w-6">
                      {getRankIcon(index)}
                    </div>
                  )}
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.display_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last referral: {format(new Date(user.last_referral_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {user.total_referrals}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.provider_referrals} providers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {leaderboard?.length === 0 && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
            <p className="text-muted-foreground">
              Start referring members to see your ranking here.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
