import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RevenueChartProps {
  businessId: string;
}

interface MonthlyRevenue {
  name: string;
  revenue: number;
}

export default function RevenueChart({ businessId }: RevenueChartProps) {
  const { toast } = useToast();
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          loadRevenueData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const loadRevenueData = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, created_at, status')
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString());

      if (error) throw error;

      // Group transactions by month
      const monthlyData: { [key: string]: number } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize last 6 months with 0
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = months[date.getMonth()];
        monthlyData[monthKey] = 0;
      }

      // Aggregate revenue by month
      transactions?.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = months[date.getMonth()];
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += Number(transaction.amount);
        }
      });

      // Convert to chart format
      const chartData = Object.entries(monthlyData).map(([name, revenue]) => ({
        name,
        revenue: Number(revenue.toFixed(2))
      }));

      setData(chartData);
    } catch (error: any) {
      toast({
        title: "Error loading revenue data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Tracking</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, month) => sum + month.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Tracking</CardTitle>
        <CardDescription>
          Last 6 months • Total: ${totalRevenue.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--color-revenue)" 
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
