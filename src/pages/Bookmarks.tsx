import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/marketplace/PostCard";
import { PostSkeleton } from "@/components/ui/post-skeleton";
import { BottomNavigation } from "@/components/feed/BottomNavigation";

interface SavedPost {
  id: string;
  post_id: string;
  post_type: string;
  user_id: string;
  created_at: string;
  post: any;
}

export default function Bookmarks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookmarkError) throw bookmarkError;

      // Fetch full post data for each bookmark
      const postsWithData = await Promise.all(
        (bookmarkData || []).map(async (bookmark) => {
          if (bookmark.post_type === "marketplace") {
            const { data: postData } = await supabase
              .from("marketplace_posts")
              .select("*")
              .eq("id", bookmark.post_id)
              .single();

            if (!postData) return null;

            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", postData.user_id)
              .single();

            return {
              ...bookmark,
              post: {
                ...postData,
                user: profile || { full_name: "Unknown", avatar_url: null },
              },
            };
          }
          return null;
        })
      );

      setBookmarks(postsWithData.filter((b): b is SavedPost => b !== null && b.post !== null));
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast({
        title: "Error",
        description: "Failed to load bookmarks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.post_id !== postId));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Saved Posts</h1>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No saved posts yet</h2>
            <p className="text-muted-foreground mb-6">
              Bookmark posts to save them for later
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="relative">
                <PostCard post={bookmark.post} onUpdate={loadBookmarks} />
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation activeTab="feed" />
    </div>
  );
}