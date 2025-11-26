import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/dateguard/GroupCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_GROUPS = [
  { name: "Family", members: [] },
  { name: "Best Friends", members: [] },
  { name: "Security", members: [] },
  { name: "Work", members: [] },
];

export default function GuardianGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user VAI
      const { data: profile } = await supabase
        .from("profiles")
        .select("vai_number")
        .eq("id", user.id)
        .single();

      // Fetch existing groups
      const { data: existingGroups, error } = await supabase
        .from("guardian_groups")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // If no groups exist, create default groups
      if (!existingGroups || existingGroups.length === 0) {
        const defaultGroupsData = DEFAULT_GROUPS.map((group) => ({
          user_id: user.id,
          user_vai: profile?.vai_number || null,
          group_name: group.name,
          members: group.members,
        }));

        const { data: newGroups, error: createError } = await supabase
          .from("guardian_groups")
          .insert(defaultGroupsData)
          .select();

        if (createError) throw createError;
        setGroups(newGroups || []);
      } else {
        setGroups(existingGroups);
      }
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleContinue = () => {
    if (selectedGroups.size === 0) {
      toast.error("Please select at least one group");
      return;
    }
    // Store selected groups and continue to next step
    sessionStorage.setItem("dateguard_selected_groups", JSON.stringify(Array.from(selectedGroups)));
    navigate("/dateguard/activate");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2B5E] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B2B5E] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dateguard")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Select Groups</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Users className="w-12 h-12 mx-auto text-white/80" />
          <p className="text-white/90">Choose which groups to notify for this session</p>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={{
                id: group.id,
                name: group.group_name || group.name,
                members: group.members || [],
              }}
              selected={selectedGroups.has(group.id)}
              onSelect={() => handleGroupToggle(group.id)}
            />
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={selectedGroups.size === 0}
          className="w-full h-14 text-lg font-semibold bg-white text-[#1B2B5E] hover:bg-white/90"
        >
          Continue ({selectedGroups.size} {selectedGroups.size === 1 ? "group" : "groups"} selected)
        </Button>
      </main>
    </div>
  );
}


