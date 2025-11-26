import { useState, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export const CreatePostDialog = ({
  open,
  onOpenChange,
  onPostCreated,
}: CreatePostDialogProps) => {
  const [caption, setCaption] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [boostType, setBoostType] = useState("none");
  const [loading, setLoading] = useState(false);
  const [goldenRoses, setGoldenRoses] = useState(0);

  useEffect(() => {
    if (open) {
      loadGoldenRoses();
    }
  }, [open]);

  const loadGoldenRoses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("golden_roses_balance")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setGoldenRoses(data.balance);
      } else {
        // Create initial balance
        await supabase
          .from("golden_roses_balance")
          .insert({ user_id: user.id, balance: 1000 });
        setGoldenRoses(1000);
      }
    } catch (error: any) {
      console.error("Error loading golden roses:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error("Maximum 5 media files allowed");
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from("marketplace_media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("marketplace_media")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handlePost = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create a post");
        return;
      }

      if (files.length === 0) {
        toast.error("Please add at least one photo");
        return;
      }

      // Upload media
      const mediaUrls = await uploadMedia(user.id);

      // Calculate boost cost
      const boostCosts = {
        none: 0,
        standard: 50,
        premium: 100,
        spotlight: 200,
      };
      const cost = boostCosts[boostType as keyof typeof boostCosts];

      if (cost > goldenRoses) {
        toast.error("Insufficient Golden Roses");
        return;
      }

      // Create post
      const { error: postError } = await supabase
        .from("marketplace_posts")
        .insert({
          user_id: user.id,
          caption,
          location_city: locationCity || null,
          location_state: locationState || null,
          media_urls: mediaUrls,
          available_now: availableNow,
          boost_type: boostType,
          boost_expires_at:
            boostType !== "none"
              ? new Date(
                  Date.now() +
                    (boostType === "spotlight"
                      ? 7 * 24 * 60 * 60 * 1000
                      : boostType === "premium"
                      ? 48 * 60 * 60 * 1000
                      : 24 * 60 * 60 * 1000)
                ).toISOString()
              : null,
        });

      if (postError) throw postError;

      // Deduct golden roses if boosted
      if (cost > 0) {
        await supabase
          .from("golden_roses_balance")
          .update({ balance: goldenRoses - cost })
          .eq("user_id", user.id);
      }

      toast.success("Post created successfully!");
      resetForm();
      onPostCreated();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setLocationCity("");
    setLocationState("");
    setAvailableNow(false);
    setFiles([]);
    setPreviews([]);
    setBoostType("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Upload */}
          <div>
            <Label>Photos/Videos (up to 5)</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {files.length < 5 && (
                <label className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <Label>Caption</Label>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 500))}
              className="resize-none"
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {caption.length}/500
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input
                placeholder="City"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                placeholder="State"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
              />
            </div>
          </div>

          {/* Available Now */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available"
              checked={availableNow}
              onCheckedChange={(checked) => setAvailableNow(checked as boolean)}
            />
            <label htmlFor="available" className="text-sm cursor-pointer">
              Available Now
            </label>
          </div>

          {/* Boost Options */}
          <div>
            <Label>Boost Options</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Golden Roses: 🌹 {goldenRoses}
            </div>
            <RadioGroup value={boostType} onValueChange={setBoostType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex-1 cursor-pointer">
                  <div className="font-medium">No Boost</div>
                  <div className="text-xs text-muted-foreground">Free</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="flex-1 cursor-pointer">
                  <div className="font-medium">Standard Boost</div>
                  <div className="text-xs text-muted-foreground">
                    50 🌹 • 24 hours
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium" className="flex-1 cursor-pointer">
                  <div className="font-medium">Premium Boost ⭐</div>
                  <div className="text-xs text-muted-foreground">
                    100 🌹 • 48 hours
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="spotlight" id="spotlight" />
                <Label htmlFor="spotlight" className="flex-1 cursor-pointer">
                  <div className="font-medium">Spotlight Boost 💎</div>
                  <div className="text-xs text-muted-foreground">
                    200 🌹 • 7 days
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={loading || files.length === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
