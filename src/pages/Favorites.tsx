import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FavoriteUser {
  id: string;
  favorited_user_id: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    subscription_status: string;
  };
}

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: favData, error: favError } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (favError) {
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch user details for each favorite
    const favoritesWithUsers = await Promise.all(
      (favData || []).map(async (fav) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, subscription_status")
          .eq("id", fav.favorited_user_id)
          .single();

        return {
          ...fav,
          user: profile || {
            id: fav.favorited_user_id,
            full_name: "Unknown User",
            avatar_url: null,
            subscription_status: "free",
          },
        };
      })
    );

    setFavorites(favoritesWithUsers);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Removed from favorites",
    });

    fetchFavorites();
  };

  const startConversation = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_1_id.eq.${user.id},participant_2_id.eq.${userId}),and(participant_1_id.eq.${userId},participant_2_id.eq.${user.id})`
      )
      .single();

    if (existingConv) {
      navigate("/chat");
      return;
    }

    // Create new conversation
    const { error } = await supabase.from("conversations").insert({
      participant_1_id: user.id,
      participant_2_id: userId,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
      return;
    }

    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-xl font-semibold text-foreground">Favorites</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding users to your favorites to keep track of them
            </p>
            <Button onClick={() => navigate("/feed")}>
              Browse Users
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {favorites.map((fav) => (
              <Card key={fav.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={fav.user.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {fav.user.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {fav.user.full_name}
                      </h3>
                      {fav.user.subscription_status === "premium" && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Added {new Date(fav.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => startConversation(fav.user.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/profile/${fav.user.id}`)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFavorite(fav.id)}
                      >
                        <Heart className="h-4 w-4 mr-2 fill-destructive text-destructive" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
