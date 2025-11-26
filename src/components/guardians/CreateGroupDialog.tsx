import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, User, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Guardian {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableGuardians: Guardian[];
}

export default function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  availableGuardians 
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedGuardians, setSelectedGuardians] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const activeGuardians = availableGuardians.filter(g => g.status === "active");

  const handleToggleGuardian = (guardianId: string) => {
    setSelectedGuardians(prev => 
      prev.includes(guardianId)
        ? prev.filter(id => id !== guardianId)
        : [...prev, guardianId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedGuardians.length === 0) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a guardian group",
          variant: "destructive"
        });
        return;
      }

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("guardian_groups")
        .insert({
          user_id: user.id,
          group_name: groupName.trim(),
          is_default: false
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add guardians to the group
      const memberInserts = selectedGuardians.map(guardianId => ({
        group_id: groupData.id,
        guardian_id: guardianId
      }));

      const { error: membersError } = await supabase
        .from("guardian_group_members")
        .insert(memberInserts);

      if (membersError) throw membersError;

      toast({
        title: "Group Created",
        description: `${groupName} group created with ${selectedGuardians.length} guardian${selectedGuardians.length !== 1 ? 's' : ''}`
      });

      setGroupName("");
      setSelectedGuardians([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Create Regional Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-foreground">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder='e.g., "Atlanta", "Dubai", "New York"'
                required
                minLength={2}
              />
              <p className="text-xs text-muted-foreground">
                💡 Use city or region names
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Select Guardians</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedGuardians.length} selected
                </span>
              </div>

              {activeGuardians.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No active guardians available. Invite guardians first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeGuardians.map(guardian => (
                    <div
                      key={guardian.id}
                      onClick={() => handleToggleGuardian(guardian.id)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedGuardians.includes(guardian.id)}
                        onCheckedChange={() => handleToggleGuardian(guardian.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground">{guardian.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{guardian.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                💡 Guardians can be in multiple regional groups
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:brightness-110"
              disabled={isSubmitting || !groupName.trim() || selectedGuardians.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
