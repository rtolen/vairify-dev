import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Users, TrendingUp, DollarSign, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InfluencerLanding() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState("");
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);

  const handleApply = () => {
    navigate("/influencers/apply");
  };

  const handleAccessCode = () => {
    if (accessCode.trim()) {
      navigate(`/influencers/access-code?code=${accessCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-cyan-500/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Partner Program
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Become a Vairify Influencer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Earn lifetime commissions by promoting the safest platform for adult services.
              Help your audience stay safe while building passive income.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={handleApply}
                size="lg"
                className="h-14 px-8 text-lg"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setShowAccessCodeInput(!showAccessCodeInput)}
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg"
              >
                Have an Access Code?
              </Button>
            </div>

            {/* Access Code Input */}
            {showAccessCodeInput && (
              <Card className="mt-6 max-w-md mx-auto">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter your access code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAccessCode()}
                      className="text-center text-lg"
                    />
                    <Button
                      onClick={handleAccessCode}
                      className="w-full"
                      disabled={!accessCode.trim()}
                    >
                      Continue with Access Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Vairify?</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <DollarSign className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Lifetime Commissions</CardTitle>
                <CardDescription>
                  Earn 10% commission on every Premium subscription you refer. Forever.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">$2/month</p>
                <p className="text-sm text-muted-foreground">per Premium referral</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Custom Codes</CardTitle>
                <CardDescription>
                  Create your own branded referral codes (e.g., "VAI-YourName") with QR codes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Unlimited</p>
                <p className="text-sm text-muted-foreground">custom codes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mb-4" />
                <CardTitle>Performance Dashboard</CardTitle>
                <CardDescription>
                  Track signups, conversions, and earnings in real-time with detailed analytics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Real-time</p>
                <p className="text-sm text-muted-foreground">analytics & insights</p>
              </CardContent>
            </Card>
          </div>

          {/* Features List */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>What You Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Custom referral codes with QR codes",
                  "Marketing materials & brand assets",
                  "Pre-written social media posts",
                  "Email templates",
                  "Performance analytics dashboard",
                  "Monthly payout processing",
                  "Dedicated support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Active social media presence",
                  "Audience in relevant niche",
                  "Commitment to safety & verification",
                  "Compliance with platform guidelines",
                  "Minimum $50 for payouts"
                ].map((requirement, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 border-t border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Start Earning?</h2>
            <p className="text-lg text-muted-foreground">
              Join our influencer program and help make the adult services industry safer while earning passive income.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleApply}
                size="lg"
                className="h-14 px-8 text-lg"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg"
              >
                Learn More About Vairify
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


