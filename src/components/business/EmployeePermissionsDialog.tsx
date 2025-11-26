import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, DollarSign, Shield, Building2, User } from "lucide-react";

interface EmployeePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    employee_user_id: string;
    feature_permissions: any;
    profiles?: {
      full_name: string;
    };
  };
  onUpdate: () => void;
}

type PermissionMode = "business_managed" | "employee_managed";

interface FeaturePermissions {
  calendar: PermissionMode;
  vairipay: PermissionMode;
  dateguard: PermissionMode;
  chats: boolean;
}

const EmployeePermissionsDialog = ({ open, onOpenChange, employee, onUpdate }: EmployeePermissionsDialogProps) => {
  const currentPermissions = employee.feature_permissions as FeaturePermissions;
  
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<FeaturePermissions>({
    calendar: currentPermissions?.calendar || "business_managed",
    vairipay: currentPermissions?.vairipay || "business_managed",
    dateguard: currentPermissions?.dateguard || "employee_managed",
    chats: currentPermissions?.chats !== false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_employees")
        .update({
          feature_permissions: permissions as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", employee.id);

      if (error) throw error;
      
      toast.success("Permissions updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const PermissionControl = ({
    icon: Icon,
    title,
    description,
    value,
    onChange
  }: {
    icon: any;
    title: string;
    description: string;
    value: PermissionMode;
    onChange: (value: PermissionMode) => void;
  }) => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <RadioGroup value={value} onValueChange={(val) => onChange(val as PermissionMode)}>
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="business_managed" id={`${title}-business`} className="mt-0.5" />
            <Label htmlFor={`${title}-business`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4" />
                Business Managed
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                You control this feature centrally for the employee
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="employee_managed" id={`${title}-employee`} className="mt-0.5" />
            <Label htmlFor={`${title}-employee`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                Employee Managed
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Employee has full control over their own settings
              </p>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Employee Permissions</DialogTitle>
          <DialogDescription>
            Configure who manages each feature for {employee.profiles?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <PermissionControl
            icon={Calendar}
            title="Calendar & Availability"
            description="Control who manages appointment scheduling and availability settings"
            value={permissions.calendar}
            onChange={(val) => setPermissions({ ...permissions, calendar: val })}
          />

          <PermissionControl
            icon={DollarSign}
            title="Vairipay (Payment Management)"
            description="Control who handles payment methods and transaction settings"
            value={permissions.vairipay}
            onChange={(val) => setPermissions({ ...permissions, vairipay: val })}
          />

          <PermissionControl
            icon={Shield}
            title="DateGuard (Safety & Guardians)"
            description="Control who manages guardian groups and safety protocols"
            value={permissions.dateguard}
            onChange={(val) => setPermissions({ ...permissions, dateguard: val })}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeePermissionsDialog;
