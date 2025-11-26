import { useState } from "react";
import { Plus, X, Lock, Eye, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GalleryImage {
  id: string;
  url: string;
  isPublic: boolean;
  uploadedAt: string;
}

interface ProfileGalleryProps {
  userId?: string;
  isOwnProfile?: boolean;
  isPremium?: boolean;
}

export const ProfileGallery = ({ 
  userId, 
  isOwnProfile = false,
  isPremium = false 
}: ProfileGalleryProps) => {
  const [publicGallery, setPublicGallery] = useState<GalleryImage[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      isPublic: true,
      uploadedAt: "2024-01-15"
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      isPublic: true,
      uploadedAt: "2024-01-14"
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
      isPublic: true,
      uploadedAt: "2024-01-13"
    },
  ]);

  const [membersGallery, setMembersGallery] = useState<GalleryImage[]>([
    {
      id: "4",
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      isPublic: false,
      uploadedAt: "2024-01-12"
    },
    {
      id: "5",
      url: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
      isPublic: false,
      uploadedAt: "2024-01-11"
    },
  ]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("public");

  const handleUpload = (isPublic: boolean) => {
    // TODO: Implement file upload
    console.log("Upload to", isPublic ? "public" : "members", "gallery");
  };

  const handleDelete = (imageId: string, isPublic: boolean) => {
    if (isPublic) {
      setPublicGallery(prev => prev.filter(img => img.id !== imageId));
    } else {
      setMembersGallery(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const renderGalleryGrid = (images: GalleryImage[], isPublic: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {isOwnProfile && (
        <button
          onClick={() => handleUpload(isPublic)}
          className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-colors group"
        >
          <Plus className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-accent transition-colors">
            Add Photo
          </span>
        </button>
      )}

      {images.map((image) => (
        <div key={image.id} className="relative aspect-square group">
          <img
            src={image.url}
            alt="Gallery"
            className="w-full h-full object-cover rounded-lg cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
          />
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setSelectedImage(image.url)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {isOwnProfile && (
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(image.id, isPublic)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {!isPublic && (
            <Badge className="absolute top-2 right-2 bg-background/90">
              <Lock className="w-3 h-3 mr-1" />
              Members
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <CardTitle>Gallery</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{publicGallery.length} public</span>
              {isPremium && (
                <>
                  <span>•</span>
                  <span>{membersGallery.length} members-only</span>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isPremium || isOwnProfile ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="public">
                  <Eye className="w-4 h-4 mr-2" />
                  Public ({publicGallery.length})
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Lock className="w-4 h-4 mr-2" />
                  Members Only ({membersGallery.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="public">
                {renderGalleryGrid(publicGallery, true)}
              </TabsContent>

              <TabsContent value="members">
                {isPremium ? (
                  renderGalleryGrid(membersGallery, false)
                ) : (
                  <div className="text-center py-8">
                    <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Upgrade to Premium to access members-only content
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            renderGalleryGrid(publicGallery, true)
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <img
            src={selectedImage || ""}
            alt="Gallery"
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};