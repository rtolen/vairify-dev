import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const stories = [
  {
    id: "your-story",
    username: "Your Story",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    hasStory: false,
    online: false,
    verified: false,
  },
  {
    id: "1",
    username: "Sarah K.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hasStory: true,
    online: true,
    verified: true,
  },
  {
    id: "2",
    username: "Jessica M.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    hasStory: true,
    online: true,
    verified: true,
  },
  {
    id: "3",
    username: "Amanda R.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    hasStory: true,
    online: false,
    verified: true,
  },
  {
    id: "4",
    username: "Michelle L.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
    hasStory: true,
    online: true,
    verified: true,
  },
  {
    id: "5",
    username: "Emily S.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
    hasStory: true,
    online: false,
    verified: true,
  },
  {
    id: "6",
    username: "Nicole T.",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop",
    hasStory: true,
    online: true,
    verified: true,
  },
  {
    id: "7",
    username: "Rachel W.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
    hasStory: true,
    online: false,
    verified: true,
  },
];

export const StoryCircles = () => {
  return (
    <div className="border-b border-border bg-background">
      <div className="flex gap-4 overflow-x-auto px-4 py-4 max-w-2xl mx-auto scrollbar-hide">
        {stories.map((story) => (
          <button
            key={story.id}
            className="flex flex-col items-center gap-1 min-w-fit group"
          >
            <div className="relative">
              <div
                className={`p-0.5 rounded-full ${
                  story.online
                    ? "bg-gradient-to-tr from-green-500 to-green-400"
                    : story.hasStory
                    ? "bg-gradient-to-tr from-primary to-purple-400"
                    : "bg-border"
                }`}
              >
                <div className="p-0.5 bg-background rounded-full">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={story.avatar} alt={story.username} />
                    <AvatarFallback>{story.username[0]}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              {story.id === "your-story" && !story.hasStory && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              
              {story.verified && story.id !== "your-story" && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-[10px] text-primary-foreground">✓</span>
                </div>
              )}
            </div>
            
            <span className="text-xs text-foreground max-w-[60px] truncate">
              {story.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
