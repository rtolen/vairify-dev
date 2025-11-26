import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (url: string) => void;
}

export const ProfilePhotoUpload = ({ currentPhotoUrl, onPhotoChange }: ProfilePhotoUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const createCroppedImage = async (): Promise<Blob> => {
    if (!selectedImage || !croppedAreaPixels) {
      throw new Error("No image selected");
    }

    const image = new Image();
    image.src = selectedImage;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas size to cropped area
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw cropped image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleUpload = async () => {
    if (!croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await createCroppedImage();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload photos");
        return;
      }

      // Generate unique filename
      const fileExt = "jpg";
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(data.path);

      onPhotoChange(publicUrl);
      setShowCropper(false);
      setSelectedImage(null);
      toast.success("Profile photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedImage(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Photo Preview */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          {currentPhotoUrl && (
            <button
              onClick={() => onPhotoChange("")}
              className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Upload Button */}
        <div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-photo-input"
          />
          <label htmlFor="profile-photo-input">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
              </span>
            </Button>
          </label>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Upload a clear photo of yourself. JPG, PNG, or WEBP. Max 5MB.
        </p>
      </div>

      {/* Cropper Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Photo</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of your image you want to use
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
