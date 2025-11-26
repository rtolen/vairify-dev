import { useState, useEffect } from "react";
import { Heart, MessageCircle, MapPin, Star, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PostGalleryView } from "./PostGalleryView";
import { PostComments } from "./PostComments";
import { VAIStatusBadge } from "@/components/vai/VAIStatusBadge";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showGallery, setShowGallery] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [vaiData, setVaiData] = useState<any>(null);

  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];
  const providerProfile = post.provider_profiles;
  const displayName = providerProfile?.username || post.profiles?.full_name || "Unknown User";
  const avatarUrl = providerProfile?.avatar_url || post.profiles?.avatar_url;
  const isVerified = providerProfile?.is_verified;

  // Load V.A.I. status
  useEffect(() => {
    const loadVAIStatus = async () => {
      try {
        const { data } = await supabase
          .from("vai_verifications")
          .select("vai_number")
          .eq("user_id", post.user_id)
          .maybeSingle();
        setVaiData(data);
      } catch (error) {
        console.error("Error loading V.A.I. status:", error);
      }
    };
    loadVAIStatus();
  }, [post.user_id]);

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }

      if (liked) {
        await supabase
          .from("marketplace_post_likes")
          .delete()
          .match({ post_id: post.id, user_id: user.id });
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("marketplace_post_likes")
          .insert({ post_id: post.id, user_id: user.id });
        setLikesCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const getBoostBadge = () => {
    if (post.boost_type === "spotlight") {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white animate-pulse">
          ✨ Spotlight
        </Badge>
      );
    }
    if (post.boost_type === "premium") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
          ⭐ Featured
        </Badge>
      );
    }
    if (post.boost_type === "standard") {
      return <Badge variant="secondary">Promoted</Badge>;
    }
    return null;
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{displayName}</span>
                {vaiData && (
                  <VAIStatusBadge 
                    isVerified={true}
                    vaiNumber={vaiData.vai_number}
                    size="sm"
                    showNumber={false}
                  />
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {(post.location_city || post.location_state) && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {post.location_city}{post.location_city && post.location_state && ', '}{post.location_state}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {getBoostBadge()}
        </div>

        {/* Media Carousel */}
        {mediaUrls.length > 0 && (
          <div className="relative aspect-square bg-muted">
            <img
              src={mediaUrls[currentImageIndex]}
              alt="Post media"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowGallery(true)}
            />
            
            {mediaUrls.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaUrls.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                
                {currentImageIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev - 1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                  >
                    ←
                  </button>
                )}
                
                {currentImageIndex < mediaUrls.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev + 1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                  >
                    →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Engagement Bar */}
        <div className="px-4 py-3 flex items-center gap-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{likesCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments_count || 0}</span>
          </Button>

          {post.available_now && (
            <Badge variant="secondary" className="ml-auto">
              <Calendar className="h-3 w-3 mr-1" />
              Available Now
            </Badge>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <p className="text-sm">
              <span className="font-semibold mr-2">{displayName}</span>
              {post.caption}
            </p>
          </div>
        )}

        {/* Rating & Book Button */}
        <div className="px-4 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1">(0)</span>
          </div>
          
          <Button size="sm" className="w-full max-w-[200px]">
            Book Appointment
          </Button>
        </div>
      </Card>

      {/* Full Screen Gallery */}
      <PostGalleryView
        open={showGallery}
        onOpenChange={setShowGallery}
        mediaUrls={mediaUrls}
        initialIndex={currentImageIndex}
      />

      {/* Comments Dialog */}
      <PostComments
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
      />
    </>
  );
};
