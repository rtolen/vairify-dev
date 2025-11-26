import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreVertical, Shield, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PostComments } from "./PostComments";

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
    location: string;
    rating: number;
    reviewCount: number;
  };
  online: boolean;
  hasSafetyBadge: boolean;
  images: string[];
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
}

export const PostCard = ({ post, onLike }: PostCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      onLike(post.id);
    }
    setIsLiked(!isLiked);
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const truncatedCaption = post.caption.length > 100 
    ? post.caption.slice(0, 100) + "..." 
    : post.caption;

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {post.user.name}
                </h3>
                {post.user.verified && (
                  <Badge className="w-4 h-4 p-0 bg-primary flex items-center justify-center">
                    <span className="text-[10px] text-primary-foreground">✓</span>
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{post.user.location}</span>
                <span>•</span>
                <span className={post.online ? "text-green-600 font-medium flex items-center gap-1" : ""}>
                  {post.online && <span className="w-2 h-2 bg-green-600 rounded-full" />}
                  {post.online ? "Online" : "Offline"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{post.user.rating}</span>
                  <span className="text-muted-foreground/60">({post.user.reviewCount})</span>
                </div>
                {post.hasSafetyBadge && (
                  <>
                    <span>•</span>
                    <Shield className="w-3 h-3 text-primary" />
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button className="p-1 hover:bg-accent rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        <img
          src={post.images[currentImageIndex]}
          alt="Post content"
          className="w-full aspect-square object-cover"
        />
        
        {post.images.length > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex
                      ? "bg-white"
                      : "bg-white/50"
                  }`}
                />
              ))}
            </div>
            
            {currentImageIndex > 0 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                ←
              </button>
            )}
            
            {currentImageIndex < post.images.length - 1 && (
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                →
              </button>
            )}
          </>
        )}
      </div>

      {/* Engagement */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
            <span className="text-sm font-medium text-foreground">{post.likes}</span>
          </button>
          
          <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <MessageCircle className="w-6 h-6 text-foreground" />
            <span className="text-sm font-medium text-foreground">{post.comments}</span>
          </button>
          
          <button className="ml-auto hover:opacity-70 transition-opacity">
            <Share2 className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Caption */}
        <div className="text-sm text-foreground">
          <span className="font-semibold mr-2">{post.user.name}</span>
          <span>
            {showFullCaption ? post.caption : truncatedCaption}
            {post.caption.length > 100 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-muted-foreground ml-1 hover:opacity-70"
              >
                {showFullCaption ? "less" : "more"}
              </button>
            )}
          </span>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">{post.timestamp}</p>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <PostComments 
            postId={post.id}
            comments={[
              {
                id: "1",
                user: {
                  name: "Jessica M.",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
                  verified: true
                },
                content: "Love this! 😍",
                likes: 5,
                timestamp: "2h ago"
              },
              {
                id: "2",
                user: {
                  name: "Amanda R.",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                  verified: true
                },
                content: "Looking amazing as always! 🔥",
                likes: 3,
                timestamp: "3h ago"
              }
            ]}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
