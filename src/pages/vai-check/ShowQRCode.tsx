import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Download, Printer, Share2, Globe, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import vairifyLogo from "@/assets/vairify-logo.png";
import { VAINumberBadge } from "@/components/vai/VAINumberBadge";

interface GalleryPhoto {
  id: string;
  url: string;
  order: number;
}

interface ProfileData {
  username: string;
  vaiNumber: string;
  avatarUrl?: string;
  publicGallery: GalleryPhoto[];
  membersGallery: GalleryPhoto[];
}

export default function ShowQRCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMember = searchParams.get("member") === "true"; // Check if viewing as member
  
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "SampleProvider",
    vaiNumber: "9I7T35L",
    avatarUrl: undefined,
    publicGallery: [],
    membersGallery: [],
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Load actual profile data from database
      // For now using mock data
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const qrData = `https://app.vairify.com/profile/${profileData.vaiNumber}`;

  const handleEmailQR = () => {
    const subject = encodeURIComponent("My Vairify Profile");
    const body = encodeURIComponent(`Check out my Vairify profile: ${qrData}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleTextQR = () => {
    const text = encodeURIComponent(`Check out my Vairify profile: ${qrData}`);
    window.location.href = `sms:?body=${text}`;
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `vairify-qr-${profileData.vaiNumber}.png`;
    link.href = url;
    link.click();
    toast.success("QR Code downloaded!");
  };

  const handlePrintQR = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrData);
    toast.success("Link copied to clipboard!");
  };

  const activeGallery = isMember 
    ? [...profileData.publicGallery, ...profileData.membersGallery]
    : profileData.publicGallery;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">My QR Code</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                {profileData.avatarUrl ? (
                  <img
                    src={profileData.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profileData.username}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <VAINumberBadge vaiNumber={profileData.vaiNumber} size="md" />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-6">
            {/* QR Code Display */}
            <Card>
              <CardHeader>
                <CardTitle>Your Personal QR Code</CardTitle>
                <CardDescription>
                  Share this code with clients to give them instant access to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <QRCodeSVG
                      value={qrData}
                      size={256}
                      level="H"
                      includeMargin
                      imageSettings={{
                        src: vairifyLogo,
                        x: undefined,
                        y: undefined,
                        height: 60,
                        width: 60,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan to view: {qrData}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sharing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your QR Code</CardTitle>
                <CardDescription>
                  Choose how you want to share your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleEmailQR}
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleTextQR}
                    className="justify-start"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Text QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                    className="justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handlePrintQR}
                    className="justify-start"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="justify-start md:col-span-2"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Profile Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gallery Access Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {isMember ? <Lock className="w-5 h-5 text-primary" /> : <Globe className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {isMember ? "Members-Only Access" : "Public Access"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isMember 
                        ? `Viewing as verified member. You can see ${profileData.publicGallery.length} public photos and ${profileData.membersGallery.length} members-only photos.`
                        : `Public view. Showing ${profileData.publicGallery.length} public photos. Members-only photos are hidden.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {/* Public Gallery */}
            {profileData.publicGallery.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <CardTitle>Public Gallery</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {profileData.publicGallery.length} photos
                    </Badge>
                  </div>
                  <CardDescription>
                    Visible to anyone who scans your QR code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profileData.publicGallery
                      .sort((a, b) => a.order - b.order)
                      .map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group"
                        >
                          <img
                            src={photo.url}
                            alt={`Gallery ${photo.order + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members-Only Gallery */}
            {isMember && profileData.membersGallery.length > 0 && (
              <Card className="border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      <CardTitle>Members-Only Gallery</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-primary/20">
                      {profileData.membersGallery.length} photos
                    </Badge>
                  </div>
                  <CardDescription>
                    Exclusive content for verified Vairify members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profileData.membersGallery
                      .sort((a, b) => a.order - b.order)
                      .map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-primary/50 group"
                        >
                          <img
                            src={photo.url}
                            alt={`Members ${photo.order + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="bg-primary/80 text-primary-foreground">
                              <Lock className="w-3 h-3 mr-1" />
                              Members
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members-Only Locked State */}
            {!isMember && profileData.membersGallery.length > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Members-Only Gallery
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    This provider has {profileData.membersGallery.length} exclusive photos available to verified Vairify members only.
                  </p>
                  <Button variant="default">
                    Verify to View Members Gallery
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {activeGallery.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Globe className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Photos Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upload photos in your profile settings to showcase your work.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/profile/create")}>
                    Add Photos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
