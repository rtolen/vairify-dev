import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function VAIRedemption() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasVAI, setHasVAI] = useState<boolean | null>(null);
  const [vaiNumber, setVAINumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExistingVAI = async () => {
    if (!vaiNumber) {
      toast({
        title: "V.A.I. Required",
        description: "Please enter your V.A.I. number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Verify existing V.A.I. through internal system
      const { data: verification, error } = await supabase
        .from("vai_verifications")
        .select("*")
        .eq("vai_number", vaiNumber.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!verification) {
        toast({
          title: "V.A.I. Not Found",
          description: "This V.A.I. number doesn't exist in our system",
          variant: "destructive",
        });
        return;
      }

      // If they have a coupon code, redeem it
      if (couponCode) {
        await redeemCoupon(verification.user_id);
      } else {
        toast({
          title: "V.A.I. Verified",
          description: "Your V.A.I. has been verified",
        });
        navigate("/feed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewVAI = () => {
    // Redirect to ComplyCube verification
    toast({
      title: "Redirecting...",
      description: "You'll be redirected to complete identity verification",
    });
    // In production, this would redirect to ComplyCube
    setTimeout(() => {
      navigate("/vai-check/intro");
    }, 1500);
  };

  const redeemCoupon = async (userId: string) => {
    try {
      // Verify coupon exists and is unused
      const { data: coupon, error: couponError } = await supabase
        .from("business_vai_coupons")
        .select("*, businesses(id, business_name)")
        .eq("coupon_code", couponCode.toUpperCase())
        .eq("status", "unused")
        .maybeSingle();

      if (couponError) throw couponError;

      if (!coupon) {
        toast({
          title: "Invalid Coupon",
          description: "This coupon code is invalid or already used",
          variant: "destructive",
        });
        return;
      }

      // Generate business-specific V.A.I. number
      const { data: bizVAI } = await supabase.rpc("generate_business_vai_number");

      // Create employee record
      const { error: employeeError } = await supabase
        .from("business_employees")
        .insert({
          business_id: coupon.business_id,
          employee_user_id: userId,
          business_vai_number: bizVAI,
          status: "active",
        });

      if (employeeError) throw employeeError;

      // Mark coupon as used
      const { error: updateError } = await supabase
        .from("business_vai_coupons")
        .update({
          status: "used",
          redeemed_by_user_id: userId,
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", coupon.id);

      if (updateError) throw updateError;

      toast({
        title: "Coupon Redeemed!",
        description: `You've been added to ${coupon.businesses?.business_name}`,
      });

      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>V.A.I. Verification</CardTitle>
          <CardDescription>
            Verify your identity to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasVAI === null && (
            <div className="space-y-4">
              <Label>Do you have a V.A.I.?</Label>
              <RadioGroup
                onValueChange={(value) => setHasVAI(value === "yes")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes, I have a V.A.I.</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No, I need to get verified</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {hasVAI === true && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vaiNumber">Your V.A.I. Number</Label>
                <Input
                  id="vaiNumber"
                  placeholder="e.g., 9I7T35L"
                  value={vaiNumber}
                  onChange={(e) => setVAINumber(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                <Input
                  id="couponCode"
                  placeholder="VAI-XXXXXXXXXX"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a business coupon code if you're joining as an employee
                </p>
              </div>

              <Button
                onClick={handleExistingVAI}
                disabled={isProcessing || !vaiNumber}
                className="w-full"
              >
                {isProcessing ? "Verifying..." : "Continue"}
              </Button>
            </div>
          )}

          {hasVAI === false && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to complete identity verification through our secure verification partner.
              </p>
              <Button onClick={handleNewVAI} className="w-full">
                Start Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
