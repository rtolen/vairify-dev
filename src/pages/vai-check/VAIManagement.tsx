import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VAIProfileCard } from "@/components/vai/VAIProfileCard";
import { VAIVerificationHistory } from "@/components/vai/VAIVerificationHistory";

const VAIManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vaiData, setVaiData] = useState<any>(null);
  const [verificationEvents, setVerificationEvents] = useState<any[]>([]);

  useEffect(() => {
    loadVAIData();
  }, []);

  const loadVAIData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load V.A.I. verification data
      const { data: vaiVerification } = await supabase
        .from("vai_verifications")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setVaiData(vaiVerification);

      // Create mock verification history for now
      if (vaiVerification) {
        setVerificationEvents([
          {
            id: "1",
            type: "verification",
            status: "completed",
            timestamp: vaiVerification.created_at,
            description: "V.A.I. verification completed successfully"
          }
        ]);
      }
    } catch (error) {
      console.error("Error loading V.A.I. data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    // Navigate to ChainPass verification
    const redirectUrl = `${window.location.origin}/vai-callback`;
    const chainpassUrl = `https://platform.chainpass.com/verify?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = chainpassUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">V.A.I. Management</h1>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <VAIProfileCard
              vaiNumber={vaiData?.vai_number}
              verifiedAt={vaiData?.created_at}
              biometricPhotoUrl={vaiData?.biometric_photo_url}
              isVerified={!!vaiData}
              onStartVerification={handleStartVerification}
            />

            {vaiData && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-card/80 backdrop-blur-lg rounded-lg border border-white/10">
                  <p className="text-sm text-muted-foreground mb-1">Verification Method</p>
                  <p className="font-semibold">ChainPass Biometric</p>
                </div>
                <div className="p-4 bg-card/80 backdrop-blur-lg rounded-lg border border-white/10">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold text-green-500">Active</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <VAIVerificationHistory events={verificationEvents} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VAIManagement;
