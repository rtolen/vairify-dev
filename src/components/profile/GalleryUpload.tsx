import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, GripVertical, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

interface GalleryUploadProps {
  photos: GalleryPhoto[];
  onPhotosChange: (photos: GalleryPhoto[]) => void;
  maxPhotos?: number;
  galleryType: "public" | "members";
}

const SortablePhotoItem = ({ 
  photo, 
  onRemove,
  galleryType 
}: { 
  photo: GalleryPhoto; 
  onRemove: () => void;
  galleryType: "public" | "members";
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-50"
      )}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
        <img
          src={photo.url}
          alt={`Gallery ${photo.order + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-foreground" />
        </div>

        {/* Gallery Type Badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {galleryType === "public" ? (
              <><Globe className="w-3 h-3 mr-1" /> Public</>
            ) : (
              <><Lock className="w-3 h-3 mr-1" /> Members</>
            )}
          </Badge>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="absolute bottom-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
          aria-label="Remove photo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Order Number */}
        <div className="absolute bottom-2 left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
          {photo.order + 1}
        </div>
      </div>
    </div>
  );
};

export const GalleryUpload = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 8,
  galleryType 
}: GalleryUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);

      const newPhotos = arrayMove(photos, oldIndex, newIndex).map((photo, index) => ({
        ...photo,
        order: index,
      }));

      onPhotosChange(newPhotos);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Check total photos limit
    const remainingSlots = maxPhotos - photos.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more photo(s)`);
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload photos");
        return;
      }

      const uploadPromises = files.map(async (file, index) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 5MB`);
        }

        // Generate filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${galleryType}/gallery-${Date.now()}-${index}.${fileExt}`;

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Add new photos with correct order
      const newPhotos: GalleryPhoto[] = uploadedUrls.map((url, index) => ({
        id: `${Date.now()}-${index}`,
        url,
        order: photos.length + index,
      }));

      onPhotosChange([...photos, ...newPhotos]);
      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload photos. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleRemove = (photoId: string) => {
    const newPhotos = photos
      .filter((p) => p.id !== photoId)
      .map((photo, index) => ({ ...photo, order: index }));
    
    onPhotosChange(newPhotos);
    toast.success("Photo removed");
  };

  const canUploadMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Photos Grid */}
      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <SortablePhotoItem
                  key={photo.id}
                  photo={photo}
                  onRemove={() => handleRemove(photo.id)}
                  galleryType={galleryType}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload Button */}
      {canUploadMore && (
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {galleryType === "public" ? (
                  <Globe className="w-6 h-6 text-primary" />
                ) : (
                  <Lock className="w-6 h-6 text-primary" />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  {galleryType === "public" ? "Public Gallery" : "Members-Only Gallery"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {photos.length} of {maxPhotos} photos uploaded
                </p>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                multiple
                className="hidden"
                id={`gallery-${galleryType}-input`}
                disabled={isUploading}
              />
              <label htmlFor={`gallery-${galleryType}-input`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Add Photos"}
                  </span>
                </Button>
              </label>

              <p className="text-xs text-muted-foreground text-center">
                {galleryType === "public" 
                  ? "Visible to everyone who scans your QR code"
                  : "Only visible to verified members"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helper Text */}
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Drag and drop to reorder photos after uploading
        </p>
      )}
    </div>
  );
};
