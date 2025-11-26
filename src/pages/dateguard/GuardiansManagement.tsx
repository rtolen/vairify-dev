import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EmptyGuardiansState from "@/components/guardians/EmptyGuardiansState";
import InviteGuardianDialog from "@/components/guardians/InviteGuardianDialog";
import GuardianCard from "@/components/guardians/GuardianCard";
import RegionalGroupCard from "@/components/guardians/RegionalGroupCard";
import CreateGroupDialog from "@/components/guardians/CreateGroupDialog";

interface Guardian {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  invited_at?: string;
}

interface GuardianGroup {
  id: string;
  group_name: string;
  is_default: boolean;
  active_count: number;
  pending_count: number;
  total_count: number;
}

export default function GuardiansManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [groups, setGroups] = useState<GuardianGroup[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showAllGuardians, setShowAllGuardians] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load guardians
      const { data: guardiansData, error: guardiansError } = await supabase
        .from("guardians")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (guardiansError) throw guardiansError;
      setGuardians(guardiansData || []);

      // Load groups - directly query the table since view doesn't exist yet
      const { data: groupsData, error: groupsError } = await supabase
        .from("guardian_groups")
        .select(`
          id,
          group_name,
          is_default,
          guardian_group_members (
            guardian_id,
            guardians (
              status
            )
          )
        `)
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (groupsError) throw groupsError;
      
      // Transform the data to match our interface
      const transformedGroups = (groupsData || []).map((group: any) => ({
        id: group.id,
        group_name: group.group_name,
        is_default: group.is_default,
        active_count: group.guardian_group_members?.filter((m: any) => 
          m.guardians?.status === 'active'
        ).length || 0,
        pending_count: group.guardian_group_members?.filter((m: any) => 
          m.guardians?.status === 'pending'
        ).length || 0,
        total_count: group.guardian_group_members?.length || 0
      }));
      
      setGroups(transformedGroups);
    } catch (error) {
      console.error("Error loading guardians:", error);
      toast({
        title: "Error",
        description: "Failed to load guardians",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuardian = async (guardianId: string) => {
    try {
      const { error } = await supabase
        .from("guardians")
        .delete()
        .eq("id", guardianId);

      if (error) throw error;

      toast({
        title: "Guardian Removed",
        description: "Guardian has been removed successfully"
      });

      loadData();
    } catch (error) {
      console.error("Error removing guardian:", error);
      toast({
        title: "Error",
        description: "Failed to remove guardian",
        variant: "destructive"
      });
    }
  };

  const handleResendInvite = async (guardianId: string) => {
    try {
      const { error } = await supabase
        .from("guardians")
        .update({ last_resent_at: new Date().toISOString() })
        .eq("id", guardianId);

      if (error) throw error;

      toast({
        title: "Invitation Resent",
        description: "Invitation SMS has been sent again"
      });
    } catch (error) {
      console.error("Error resending invite:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
    }
  };

  const activeGuardians = guardians.filter(g => g.status === "active");
  const pendingGuardians = guardians.filter(g => g.status === "pending");
  const regionalGroups = groups.filter(g => !g.is_default);
  const hasGuardians = guardians.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(265,70%,20%)] to-[hsl(270,60%,30%)] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(265,70%,20%)] to-[hsl(270,60%,30%)] text-white">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dateguard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="text-lg font-semibold">MY GUARDIANS</h1>
          </div>
        </div>
        {hasGuardians && (
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Invite
          </Button>
        )}
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {!hasGuardians ? (
          <EmptyGuardiansState onInvite={() => setShowInviteDialog(true)} />
        ) : (
          <>
            {/* Main Group */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Main Group</h2>
                <span className="text-sm text-white/50">All Guardians</span>
              </div>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowAllGuardians(!showAllGuardians)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-white" />
                      <div className="text-left">
                        <h3 className="text-white font-semibold">All Guardians</h3>
                        <p className="text-sm text-white/60">
                          {activeGuardians.length} active{pendingGuardians.length > 0 && ` • ${pendingGuardians.length} pending`}
                        </p>
                      </div>
                    </div>
                    {showAllGuardians ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </button>

                  {showAllGuardians && (
                    <div className="mt-4 space-y-3">
                      {activeGuardians.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-white/50 uppercase">Active ({activeGuardians.length})</h4>
                          {activeGuardians.map(guardian => (
                            <GuardianCard
                              key={guardian.id}
                              guardian={guardian}
                              onRemove={handleRemoveGuardian}
                            />
                          ))}
                        </div>
                      )}

                      {pendingGuardians.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-yellow-400/70 uppercase">Pending Invites ({pendingGuardians.length})</h4>
                          {pendingGuardians.map(guardian => (
                            <GuardianCard
                              key={guardian.id}
                              guardian={guardian}
                              onRemove={handleRemoveGuardian}
                              onResend={handleResendInvite}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Regional Groups */}
            {regionalGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Regional Groups</h2>
                <div className="space-y-3">
                  {regionalGroups.map(group => (
                    <RegionalGroupCard
                      key={group.id}
                      group={group}
                      onEdit={(id) => console.log("Edit group:", id)}
                      onDelete={(id) => console.log("Delete group:", id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Create Regional Group Button */}
            <Button
              onClick={() => setShowCreateGroupDialog(true)}
              variant="outline"
              className="w-full h-12 border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Regional Group
            </Button>
          </>
        )}
      </main>

      <InviteGuardianDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={loadData}
      />

      <CreateGroupDialog
        open={showCreateGroupDialog}
        onOpenChange={setShowCreateGroupDialog}
        onSuccess={loadData}
        availableGuardians={guardians}
      />
    </div>
  );
}
