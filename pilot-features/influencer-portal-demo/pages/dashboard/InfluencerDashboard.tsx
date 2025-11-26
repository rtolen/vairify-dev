import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, QrCode, FileText, Settings, LogOut, Code, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CustomCodeGenerator } from "../components/dashboard/CustomCodeGenerator";
import { QRCodeManager } from "../components/dashboard/QRCodeManager";
import { PerformanceDashboard } from "../components/dashboard/PerformanceDashboard";
import { MarketingMaterials } from "../components/dashboard/MarketingMaterials";
import { EarningsPayouts } from "../components/dashboard/EarningsPayouts";
import { InfluencerSettings } from "../components/dashboard/InfluencerSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [influencer, setInfluencer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("codes");

  useEffect(() => {
    loadInfluencerData();
  }, []);

  const loadInfluencerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/influencers/login");
        return;
      }

      const { data: influencerData, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !influencerData) {
        toast.error("Influencer account not found");
        navigate("/influencers");
        return;
      }

      if (influencerData.status !== 'approved') {
        toast.error("Your account is not yet approved");
        navigate("/influencers/application-status");
        return;
      }

      setInfluencer(influencerData);
    } catch (error) {
      console.error('Error loading influencer data:', error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/influencers");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!influencer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Influencer Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {influencer.username}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success">
                Commission: {(influencer.commission_rate * 100).toFixed(0)}%
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="codes">
              <Code className="w-4 h-4 mr-2" />
              Codes
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="w-4 h-4 mr-2" />
              QR Codes
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="materials">
              <FileText className="w-4 h-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="codes">
            <CustomCodeGenerator influencerId={influencer.id} />
          </TabsContent>

          <TabsContent value="qr">
            <QRCodeManager influencerId={influencer.id} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceDashboard influencerId={influencer.id} />
          </TabsContent>

          <TabsContent value="materials">
            <MarketingMaterials />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsPayouts influencerId={influencer.id} />
          </TabsContent>

          <TabsContent value="settings">
            <InfluencerSettings influencer={influencer} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


