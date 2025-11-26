import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBookmarks = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setBookmarkedPosts(new Set(data?.map((b) => b.post_id) || []));
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to bookmark posts.",
          variant: "destructive",
        });
        return;
      }

      const isBookmarked = bookmarkedPosts.has(postId);

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        if (error) throw error;

        setBookmarkedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });

        toast({
          title: "Bookmark removed",
          description: "Post removed from your saved items.",
        });
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            post_id: postId,
          });

        if (error) throw error;

        setBookmarkedPosts((prev) => new Set(prev).add(postId));

        toast({
          title: "Post saved",
          description: "Added to your bookmarks.",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    bookmarkedPosts,
    loading,
    toggleBookmark,
    isBookmarked: (postId: string) => bookmarkedPosts.has(postId),
  };
};