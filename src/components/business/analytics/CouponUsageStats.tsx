import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CouponUsageStatsProps {
  businessId: string;
}

interface UsageData {
  name: string;
  generated: number;
  redeemed: number;
  available: number;
}

export default function CouponUsageStats({ businessId }: CouponUsageStatsProps) {
  const { toast } = useToast();
  const [data, setData] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, [businessId]);

  const loadUsageData = async () => {
    try {
      const { data: coupons, error } = await supabase
        .from("business_vai_coupons")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by month for the last 6 months
      const now = new Date();
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const generatedCount = coupons?.filter(c => {
          const createdDate = new Date(c.created_at);
          return createdDate >= monthStart && createdDate <= monthEnd;
        }).length || 0;

        const redeemedCount = coupons?.filter(c => {
          const redeemedDate = c.redeemed_at ? new Date(c.redeemed_at) : null;
          return redeemedDate && redeemedDate >= monthStart && redeemedDate <= monthEnd;
        }).length || 0;

        const availableCount = coupons?.filter(c => {
          const createdDate = new Date(c.created_at);
          return createdDate <= monthEnd && c.status === 'unused';
        }).length || 0;

        months.push({
          name: monthName,
          generated: generatedCount,
          redeemed: redeemedCount,
          available: availableCount,
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
          <CardTitle>Coupon Usage Statistics</CardTitle>
          <CardDescription>Loading coupon data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartConfig = {
    generated: {
      label: "Generated",
      color: "hsl(var(--primary))",
    },
    redeemed: {
      label: "Redeemed",
      color: "hsl(var(--chart-2))",
    },
    available: {
      label: "Available",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>V.A.I. Coupon Usage Over Time</CardTitle>
        <CardDescription>Track coupon generation, redemption, and availability</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="generated" 
              stroke="var(--color-generated)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="redeemed" 
              stroke="var(--color-redeemed)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="available" 
              stroke="var(--color-available)" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
