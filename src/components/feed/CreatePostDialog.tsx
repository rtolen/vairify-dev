import { useState } from "react";
import { X, Image as ImageIcon, Video, Smile, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePostDialog = ({ open, onOpenChange }: CreatePostDialogProps) => {
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!caption.trim() && selectedImages.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content to your post",
        variant: "destructive"
      });
      return;
    }

    // TODO: Submit to backend
    console.log("Posting:", { caption, images: selectedImages });
    toast({
      title: "Post shared!",
      description: "Your post has been shared with the community"
    });
    
    setCaption("");
    setSelectedImages([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Your Profile</p>
              <p className="text-xs text-muted-foreground">Public post</p>
            </div>
          </div>

          {/* Caption */}
          <Textarea
            placeholder="What's on your mind? Share your story..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[120px] resize-none"
          />

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm font-medium mb-3">Add to your post</p>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Photos</span>
                </div>
              </label>

              <Button variant="ghost" size="sm" className="text-sm" disabled>
                <Video className="w-5 h-5 mr-2" />
                Video
              </Button>

              <Button variant="ghost" size="sm" className="text-sm" disabled>
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </Button>

              <Button variant="ghost" size="sm" className="text-sm" disabled>
                <Smile className="w-5 h-5 mr-2" />
                Feeling
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handlePost}
            className="w-full"
            size="lg"
          >
            Share Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};