import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VAIStatusBadge } from "@/components/vai/VAIStatusBadge";

export default function VAISettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vaiData, setVaiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVAIData();
  }, []);

  const loadVAIData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vai_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setVaiData(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load V.A.I. status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = () => {
    const redirectUrl = `${window.location.origin}/vai-callback`;
    const chainpassUrl = `https://platform.chainpass.com/verify?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = chainpassUrl;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* V.A.I. Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>V.A.I. Verification</CardTitle>
                <CardDescription>Verified Anonymous Identity</CardDescription>
              </div>
            </div>
            <VAIStatusBadge 
              isVerified={!!vaiData} 
              vaiNumber={vaiData?.vai_number}
              size="md"
              showNumber={false}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {vaiData ? (
            <>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">V.A.I. Number</p>
                      <p className="text-sm text-muted-foreground">
                        Your verified anonymous identity
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-mono">
                    {vaiData.vai_number}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Verified Since</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(vaiData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Active
                  </Badge>
                </div>
              </div>

              <Button 
                onClick={() => navigate("/vai-management")}
                className="w-full"
                variant="outline"
              >
                Manage V.A.I. Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You haven't completed V.A.I. verification yet. Verify your identity to unlock enhanced security features and build trust with the community.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Enhanced Security</p>
                    <p className="text-sm text-muted-foreground">
                      Protect your identity while building trust
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Community Trust</p>
                    <p className="text-sm text-muted-foreground">
                      Verified members get priority visibility
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Access Premium Features</p>
                    <p className="text-sm text-muted-foreground">
                      Unlock DateGuard, VAI-CHECK, and more
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleStartVerification}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Start V.A.I. Verification
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>V.A.I. Benefits</CardTitle>
          <CardDescription>Why verify your identity?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Priority Access</p>
              <p className="text-sm text-muted-foreground">
                V.A.I. verified users appear first in search results
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Premium Features</p>
              <p className="text-sm text-muted-foreground">
                Access DateGuard safety features and VAI-CHECK encounters
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Community Trust</p>
              <p className="text-sm text-muted-foreground">
                Build credibility and attract more clients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
