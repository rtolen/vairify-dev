import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, X, Crown, Users } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  user_id: string;
  application_type: string;
  status: string;
  social_handles: any;
  audience_size: string;
  application_notes: string;
  admin_notes: string;
  applied_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  subscription_status: string;
  created_at: string;
  is_founding_council: boolean;
  user_roles: Array<{ role: string }>;
}

export default function InfluencerManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/feed");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadApplications();
      loadMembers();
    }
  }, [isAdmin]);

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from("influencer_applications")
      .select(`
        *,
        profiles(full_name, email)
      `)
      .order("applied_at", { ascending: false });

    if (!error && data) {
      setApplications(data as any);
    }
    setLoading(false);
  };

  const loadMembers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email, subscription_status, created_at");

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const { data: foundingCouncil } = await supabase
      .from("founding_council_members")
      .select("user_id");

    if (profilesData && rolesData) {
      const foundingCouncilIds = new Set(foundingCouncil?.map((m: any) => m.user_id) || []);
      const influencerAffiliateIds = new Set(
        rolesData
          .filter((r: any) => r.role === "influencer" || r.role === "affiliate")
          .map((r: any) => r.user_id)
      );

      const membersWithRoles = profilesData
        .filter((p: any) => influencerAffiliateIds.has(p.id))
        .map((profile: any) => ({
          ...profile,
          is_founding_council: foundingCouncilIds.has(profile.id),
          user_roles: rolesData.filter((r: any) => r.user_id === profile.id),
        }));

      setMembers(membersWithRoles as any);
    }
  };

  const handleApprove = async (applicationId: string, userId: string, type: string) => {
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert([{ user_id: userId, role: type as any }]);

    if (roleError) {
      toast.error("Failed to assign role");
      return;
    }

    const { error: updateError } = await supabase
      .from("influencer_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        admin_notes: adminNotes[applicationId] || null,
      })
      .eq("id", applicationId);

    if (updateError) {
      toast.error("Failed to update application");
      return;
    }

    // Send email notification in background
    supabase.functions.invoke("notify-application-status", {
      body: {
        user_id: userId,
        application_type: type,
        status: "approved",
        admin_notes: adminNotes[applicationId] || null,
      },
    }).then(({ error: emailError }) => {
      if (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    });

    toast.success("Application approved and user notified");
    loadApplications();
    loadMembers();
  };

  const handleReject = async (applicationId: string, userId: string, type: string) => {
    const { error } = await supabase
      .from("influencer_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        admin_notes: adminNotes[applicationId] || null,
      })
      .eq("id", applicationId);

    if (error) {
      toast.error("Failed to reject application");
      return;
    }

    // Send email notification in background
    supabase.functions.invoke("notify-application-status", {
      body: {
        user_id: userId,
        application_type: type,
        status: "rejected",
        admin_notes: adminNotes[applicationId] || null,
      },
    }).then(({ error: emailError }) => {
      if (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    });

    toast.success("Application rejected and user notified");
    loadApplications();
  };

  const toggleFoundingCouncil = async (userId: string, isCurrentlyMember: boolean) => {
    if (isCurrentlyMember) {
      const { error } = await supabase
        .from("founding_council_members")
        .delete()
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to remove from Founding Council");
      } else {
        toast.success("Removed from Founding Council");
        loadMembers();
      }
    } else {
      const currentUser = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase
        .from("founding_council_members")
        .insert({
          user_id: userId,
          assigned_by: currentUser?.id,
        });

      if (error) {
        toast.error("Failed to add to Founding Council");
      } else {
        toast.success("Added to Founding Council");
        loadMembers();
      }
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const reviewedApplications = applications.filter((a) => a.status !== "pending");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Influencer & Affiliate Management</h1>
            <p className="text-muted-foreground">Manage applications and Founding Council</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Applications ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewedApplications.length})</TabsTrigger>
            <TabsTrigger value="members">Active Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending applications</p>
              </Card>
            ) : (
              pendingApplications.map((app) => (
                <Card key={app.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{app.profiles.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {app.application_type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id, app.user_id, app.application_type)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(app.id, app.user_id, app.application_type)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {app.audience_size && (
                    <p className="text-sm mb-2">
                      <strong>Audience Size:</strong> {app.audience_size}
                    </p>
                  )}

                  {app.application_notes && (
                    <p className="text-sm mb-2">
                      <strong>Notes:</strong> {app.application_notes}
                    </p>
                  )}

                  <Textarea
                    placeholder="Admin notes (optional)"
                    value={adminNotes[app.id] || ""}
                    onChange={(e) =>
                      setAdminNotes({ ...adminNotes, [app.id]: e.target.value })
                    }
                    className="mt-4"
                  />
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedApplications.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{app.profiles.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{app.profiles.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{app.application_type}</Badge>
                      <Badge
                        variant={app.status === "approved" ? "default" : "destructive"}
                      >
                        {app.status}
                      </Badge>
                    </div>
                    {app.admin_notes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        <strong>Admin Notes:</strong> {app.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            {members.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{member.full_name}</h3>
                      {member.is_founding_council && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex gap-2 mt-2">
                      {member.user_roles.map((role, idx) => (
                        <Badge key={idx} variant="outline">
                          {role.role}
                        </Badge>
                      ))}
                      <Badge>{member.subscription_status}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={member.is_founding_council ? "destructive" : "default"}
                    onClick={() =>
                      toggleFoundingCouncil(member.id, member.is_founding_council)
                    }
                  >
                    {member.is_founding_council ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Remove from Council
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-1" />
                        Add to Council
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
