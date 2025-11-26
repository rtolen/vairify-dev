import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, TrendingUp, Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeActivityChart from "@/components/business/analytics/EmployeeActivityChart";
import CouponUsageStats from "@/components/business/analytics/CouponUsageStats";
import RevenueChart from "@/components/business/analytics/RevenueChart";

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalCoupons: number;
  usedCoupons: number;
  availableCoupons: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function BusinessDashboard() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalCoupons: 0,
    usedCoupons: 0,
    availableCoupons: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [businessId]);

  const loadDashboardData = async () => {
    try {
      // Load business info
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Load employee stats
      const { data: employees, error: empError } = await supabase
        .from("business_employees")
        .select("*")
        .eq("business_id", businessId);

      if (empError) throw empError;

      const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;

      // Load coupon stats
      const { data: coupons, error: couponError } = await supabase
        .from("business_vai_coupons")
        .select("*")
        .eq("business_id", businessId);

      if (couponError) throw couponError;

      const usedCoupons = coupons?.filter(c => c.status === 'used').length || 0;
      const availableCoupons = coupons?.filter(c => c.status === 'unused').length || 0;

      // Load revenue stats
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("amount, created_at, status")
        .eq("business_id", businessId)
        .eq("status", "completed");

      if (transactionsError) throw transactionsError;

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Calculate this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyRevenue = transactions
        ?.filter(t => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees,
        totalCoupons: coupons?.length || 0,
        usedCoupons,
        availableCoupons,
        totalRevenue,
        monthlyRevenue,
      });
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
          <p className="text-muted-foreground">Loading dashboard...</p>
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
            <h1 className="text-lg font-semibold">{business.business_name} Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEmployees} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Coupons</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableCoupons}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usedCoupons} used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coupon Usage Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalCoupons > 0 
                  ? Math.round((stats.usedCoupons / stats.totalCoupons) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                of total coupons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.monthlyRevenue.toFixed(2)} this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Employee Activity</TabsTrigger>
            <TabsTrigger value="coupons">Coupon Usage</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <EmployeeActivityChart businessId={businessId!} />
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <CouponUsageStats businessId={businessId!} />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueChart businessId={businessId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
