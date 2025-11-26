import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeActivityChartProps {
  businessId: string;
}

interface ActivityData {
  name: string;
  active: number;
  inactive: number;
  fired: number;
}

export default function EmployeeActivityChart({ businessId }: EmployeeActivityChartProps) {
  const { toast } = useToast();
  const [data, setData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivityData();
  }, [businessId]);

  const loadActivityData = async () => {
    try {
      const { data: employees, error } = await supabase
        .from("business_employees")
        .select("*")
        .eq("business_id", businessId);

      if (error) throw error;

      // Group by month for the last 6 months
      const now = new Date();
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const activeCount = employees?.filter(e => 
          e.status === 'active' && 
          new Date(e.hired_at) <= monthEnd
        ).length || 0;

        const inactiveCount = employees?.filter(e => 
          e.status === 'inactive' && 
          new Date(e.hired_at) <= monthEnd &&
          (!e.fired_at || new Date(e.fired_at) > monthEnd)
        ).length || 0;

        const firedCount = employees?.filter(e => 
          e.fired_at && 
          new Date(e.fired_at) >= monthStart &&
          new Date(e.fired_at) <= monthEnd
        ).length || 0;

        months.push({
          name: monthName,
          active: activeCount,
          inactive: inactiveCount,
          fired: firedCount,
        });
      }

      setData(months);
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
      <Card>
        <CardHeader>
          <CardTitle>Employee Activity</CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartConfig = {
    active: {
      label: "Active",
      color: "hsl(var(--primary))",
    },
    inactive: {
      label: "Inactive",
      color: "hsl(var(--muted))",
    },
    fired: {
      label: "Fired",
      color: "hsl(var(--destructive))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Activity Over Time</CardTitle>
        <CardDescription>Monthly breakdown of employee status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="active" fill="var(--color-active)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inactive" fill="var(--color-inactive)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fired" fill="var(--color-fired)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
