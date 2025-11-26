import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Clock, XCircle, TrendingUp, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  application_type: string;
  status: string;
  audience_size: string;
  application_notes: string;
  admin_notes: string | null;
  applied_at: string;
  reviewed_at: string | null;
}

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    loadApplicationStatus();
  }, []);

  const loadApplicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user already has influencer or affiliate role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["influencer", "affiliate"]);

      if (roles && roles.length > 0) {
        setHasRole(true);
        setLoading(false);
        return;
      }

      // Fetch application
      const { data, error } = await supabase
        .from("influencer_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })
        .maybeSingle();

      if (error) throw error;

      setApplication(data);
    } catch (error) {
      console.error("Error loading application:", error);
      toast.error("Failed to load application status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          title: "Application Under Review",
          description: "Your application is being reviewed by our team. We'll notify you once a decision is made.",
        };
      case "approved":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          title: "Application Approved!",
          description: "Congratulations! Your application has been approved. You can now start earning as an " + (application?.application_type || "member") + ".",
        };
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          title: "Application Not Approved",
          description: "Unfortunately, your application was not approved at this time. You may reapply in the future.",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/20",
          title: "Unknown Status",
          description: "Please contact support for more information.",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasRole) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/feed")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <CardTitle>You're Already a Member!</CardTitle>
                  <CardDescription>
                    You have influencer or affiliate status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You already have influencer or affiliate access. Visit your referral dashboard to start earning.
              </p>
              <Button onClick={() => navigate("/referrals")}>
                Go to Referral Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/feed")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle>No Application Found</CardTitle>
                  <CardDescription>
                    You haven't submitted an application yet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Ready to join our network of influencers and affiliates? Submit your application to get started.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/apply/influencer")}>
                  Apply Now
                </Button>
                <Button variant="outline" onClick={() => navigate("/feed")}>
                  Back to Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(application.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/feed")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        <Card className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div>
                <CardTitle>{statusInfo.title}</CardTitle>
                <CardDescription>
                  Applied {new Date(application.applied_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {statusInfo.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold">Application Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {application.application_type === "influencer" && <Users className="w-3 h-3 mr-1" />}
                    {application.application_type === "affiliate" && <TrendingUp className="w-3 h-3 mr-1" />}
                    {application.application_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audience Size</p>
                  <p className="font-medium mt-1">{application.audience_size}</p>
                </div>
              </div>

              {application.application_notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Your Notes</p>
                  <p className="text-sm mt-1">{application.application_notes}</p>
                </div>
              )}

              {application.admin_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Admin Feedback</p>
                  <p className="text-sm mt-1">{application.admin_notes}</p>
                </div>
              )}

              {application.reviewed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                  <p className="text-sm mt-1">{new Date(application.reviewed_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {application.status === "rejected" && (
                <Button onClick={() => navigate("/apply/influencer")}>
                  Reapply
                </Button>
              )}
              {application.status === "approved" && (
                <Button onClick={() => navigate("/referrals")}>
                  Go to Referral Dashboard
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/feed")}>
                Back to Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
