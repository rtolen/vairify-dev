import { useEffect, useState } from "react";
import { Plus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Coupon {
  id: string;
  coupon_code: string;
  status: string;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  created_at: string;
}

export default function VAICouponsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, [businessId]);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("business_vai_coupons")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    });
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      // Generate new coupons by calling the generate function multiple times
      const promises = Array.from({ length: quantity }, async () => {
        const { data: codeResult } = await supabase.rpc('generate_vai_coupon_code');
        return supabase
          .from("business_vai_coupons")
          .insert({
            business_id: businessId,
            coupon_code: codeResult,
          });
      });

      await Promise.all(promises);

      toast({
        title: "Success!",
        description: `Generated ${quantity} new V.A.I. coupon${quantity > 1 ? 's' : ''}`,
      });

      setIsDialogOpen(false);
      setQuantity(1);
      loadCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const unusedCount = coupons.filter(c => c.status === 'unused').length;
  const usedCount = coupons.filter(c => c.status === 'used').length;

  if (isLoading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>V.A.I. Coupon Overview</CardTitle>
          <CardDescription>
            Manage employee V.A.I. coupons for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{unusedCount}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{usedCount}</div>
              <div className="text-sm text-muted-foreground">Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Coupon Codes</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Get More V.A.I.s
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase V.A.I. Coupons</DialogTitle>
              <DialogDescription>
                Generate additional V.A.I. coupons for your employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button
                onClick={handleGenerateMore}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? "Generating..." : `Generate ${quantity} Coupon${quantity > 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="font-mono font-semibold text-lg">{coupon.coupon_code}</div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(coupon.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={coupon.status === 'unused' ? 'default' : 'secondary'}>
                  {coupon.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(coupon.coupon_code)}
                >
                  {copiedCode === coupon.coupon_code ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
