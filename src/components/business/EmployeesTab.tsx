import { useEffect, useState } from "react";
import { UserPlus, MoreVertical, Eye, EyeOff, Calendar, DollarSign, Shield, Building2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VAINumberBadge } from "@/components/vai/VAINumberBadge";
import EmployeePermissionsDialog from "./EmployeePermissionsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FeaturePermissions {
  chats: boolean;
  vairipay: "business_managed" | "employee_managed";
  dateguard: "business_managed" | "employee_managed";
  calendar: "business_managed" | "employee_managed";
}

interface Employee {
  id: string;
  employee_user_id: string;
  business_vai_number: string;
  business_id: string;
  status: string;
  feature_permissions: FeaturePermissions;
  is_visible_in_directory: boolean;
  availability_status: string;
  profiles?: {
    full_name: string;
  };
  businesses?: {
    business_name: string;
  };
}

export default function EmployeesTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [businessId]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("business_employees")
        .select(`
          *,
          profiles:employee_user_id(full_name),
          businesses!inner(business_name)
        `)
        .eq("business_id", businessId)
        .order("hired_at", { ascending: false });

      if (error) throw error;
      setEmployees((data || []) as unknown as Employee[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from("business_employees")
        .update({ is_visible_in_directory: !employee.is_visible_in_directory })
        .eq("id", employee.id);

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Employee ${!employee.is_visible_in_directory ? 'shown in' : 'hidden from'} directory`,
      });

      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFireEmployee = async (employee: Employee) => {
    if (!confirm("Are you sure you want to fire this employee?")) return;

    try {
      const { error } = await supabase
        .from("business_employees")
        .update({
          status: "fired",
          fired_at: new Date().toISOString(),
        })
        .eq("id", employee.id);

      if (error) throw error;

      toast({
        title: "Employee Fired",
        description: "Employee status updated",
      });

      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeCount = employees.filter(e => e.status === 'active').length;
  const firedCount = employees.filter(e => e.status === 'fired').length;

  if (isLoading) {
    return <div className="text-center py-8">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{firedCount}</div>
              <div className="text-sm text-muted-foreground">Fired</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <VAINumberBadge vaiNumber={employee.business_vai_number} size="sm" showPrefix={false} />
                    <span className="text-sm font-medium">{employee.profiles?.full_name}</span>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                    {employee.status === 'active' && (
                      <Badge variant={employee.availability_status === 'available' ? 'default' : 'outline'}>
                        {employee.availability_status}
                      </Badge>
                    )}
                  </div>
                  {employee.businesses && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Linked to: <span className="font-medium">{employee.businesses.business_name}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Calendar: {employee.feature_permissions.calendar === "business_managed" ? (
                          <><Building2 className="h-3 w-3 ml-1 inline" /> Business</>
                        ) : (
                          <><UserIcon className="h-3 w-3 ml-1 inline" /> Employee</>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Vairipay: {employee.feature_permissions.vairipay === "business_managed" ? (
                          <><Building2 className="h-3 w-3 ml-1 inline" /> Business</>
                        ) : (
                          <><UserIcon className="h-3 w-3 ml-1 inline" /> Employee</>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        DateGuard: {employee.feature_permissions.dateguard === "business_managed" ? (
                          <><Building2 className="h-3 w-3 ml-1 inline" /> Business</>
                        ) : (
                          <><UserIcon className="h-3 w-3 ml-1 inline" /> Employee</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {employee.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(employee)}
                    >
                      {employee.is_visible_in_directory ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsPermissionsDialogOpen(true);
                        }}
                      >
                        Manage Permissions
                      </DropdownMenuItem>
                      {employee.status === 'active' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleFireEmployee(employee)}
                          >
                            Fire Employee
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedEmployee && (
        <EmployeePermissionsDialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          employee={selectedEmployee}
          onUpdate={loadEmployees}
        />
      )}
    </div>
  );
}
