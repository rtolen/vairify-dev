import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, UserPlus, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VAICouponsTab from "@/components/business/VAICouponsTab";
import EmployeesTab from "@/components/business/EmployeesTab";

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
}

export default function BusinessControlPanel() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  const loadBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error) throw error;
      setBusiness(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
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
            <h1 className="text-lg font-semibold">{business.business_name}</h1>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`/business/${businessId}/dashboard`)}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="coupons">
              <Ticket className="h-4 w-4 mr-2" />
              V.A.I. Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesTab businessId={businessId!} />
          </TabsContent>

          <TabsContent value="coupons">
            <VAICouponsTab businessId={businessId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
