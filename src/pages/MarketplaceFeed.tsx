import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "@/components/marketplace/PostCard";
import { CreatePostDialog } from "@/components/marketplace/CreatePostDialog";
import { GoldenRosesPurchaseDialog } from "@/components/marketplace/GoldenRosesPurchaseDialog";
import { toast } from "sonner";

type FeedFilter = "for-you" | "following" | "local";

export default function MarketplaceFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("for-you");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    loadPosts();
  }, [filter]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMorePosts();
    }
  }, [inView]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setPosts([]);
      setPage(0);
      await fetchPosts(0);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageNum: number) => {
    let query = supabase
      .from("marketplace_posts")
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        provider_profiles:user_id (
          username,
          is_verified,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    // Apply filters based on tab
    if (filter === "local") {
      // TODO: Add location-based filtering
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data) {
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPosts(prev => pageNum === 0 ? data : [...prev, ...data]);
    }
  };

  const loadMorePosts = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage);
  };

  const handlePostCreated = () => {
    loadPosts();
    setCreateDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurchaseDialogOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Get Roses
            </Button>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FeedFilter)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="for-you">For You</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="local">Local</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Feed */}
      <div className="container max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
                <div className="h-64 bg-muted rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={loadPosts} />
            ))}
            
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 text-center">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-muted-foreground py-8">
                You've reached the end of the feed
              </p>
            )}
            
            {posts.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No posts yet</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Create Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg animate-pulse hover:animate-none z-20"
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPostCreated={handlePostCreated}
      />

      {/* Golden Roses Purchase Dialog */}
      <GoldenRosesPurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onPurchaseComplete={loadPosts}
      />
    </div>
  );
}
