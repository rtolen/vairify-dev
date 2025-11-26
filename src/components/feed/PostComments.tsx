import { useState } from "react";
import { Send, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  likes: number;
  timestamp: string;
}

interface PostCommentsProps {
  postId: string;
  comments: Comment[];
}

export const PostComments = ({ postId, comments: initialComments }: PostCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        verified: true
      },
      content: newComment,
      likes: 0,
      timestamp: "Just now"
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
              <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="font-semibold text-sm">{comment.user.name}</p>
                  {comment.user.verified && (
                    <Badge className="w-3 h-3 p-0 bg-primary flex items-center justify-center">
                      <span className="text-[8px] text-primary-foreground">✓</span>
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>

              <div className="flex items-center gap-4 px-3">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {likedComments.has(comment.id) ? "Unlike" : "Like"}
                </button>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Reply
                </button>
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                {(comment.likes > 0 || likedComments.has(comment.id)) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3 fill-destructive text-destructive" />
                    <span>{comment.likes + (likedComments.has(comment.id) ? 1 : 0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment */}
      <div className="flex gap-2 pt-2 border-t">
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
          <AvatarFallback>YO</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            className="flex-1"
          />
          <Button 
            onClick={handleSubmitComment} 
            size="icon"
            disabled={!newComment.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};