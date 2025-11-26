import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VAINumberBadge } from "@/components/vai/VAINumberBadge";

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface Employee {
  id: string;
  business_vai_number: string;
  availability_status: string;
}

export default function BusinessDirectory() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      // Load business info
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Load visible employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("business_employees")
        .select("id, business_vai_number, availability_status")
        .eq("business_id", businessId)
        .eq("status", "active")
        .eq("is_visible_in_directory", true);

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!business) return null;

  const availableCount = employees.filter(e => e.availability_status === 'available').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Directory</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{business.business_name}</CardTitle>
                <CardDescription className="mt-2">
                  <Badge>{business.business_type === 'service' ? 'Service Business' : 'Non-Service Business'}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {business.description && (
              <p className="text-muted-foreground">{business.description}</p>
            )}
            <div className="grid gap-2">
              {business.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{business.email}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Providers</CardTitle>
            <CardDescription>
              {availableCount} of {employees.length} currently available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <VAINumberBadge 
                        vaiNumber={employee.business_vai_number}
                        size="md"
                        showPrefix={true}
                      />
                    </div>
                    <Badge
                      variant={employee.availability_status === 'available' ? 'default' : 'outline'}
                    >
                      {employee.availability_status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {employees.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No providers currently listed
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
