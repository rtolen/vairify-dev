import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ReferralHelp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">HOW IT WORKS</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <DollarSign className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">REFERRAL PROGRAM</h2>
          <p className="text-muted-foreground">
            Earn lifetime commission when people you invite upgrade to Premium ($20/month)
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">HOW IT WORKS:</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                1
              </div>
              <div>
                <p className="font-semibold">SHARE YOUR CODE</p>
                <p className="text-sm text-muted-foreground">
                  Share your V.A.I. code or referral link via email/SMS
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                2
              </div>
              <div>
                <p className="font-semibold">THEY SIGN UP</p>
                <p className="text-sm text-muted-foreground">
                  When they create account with your code, they're linked to you
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                3
              </div>
              <div>
                <p className="font-semibold">THEY UPGRADE TO PREMIUM</p>
                <p className="text-sm text-muted-foreground">
                  If they upgrade to Premium ($20/month), you start earning
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                4
              </div>
              <div>
                <p className="font-semibold">YOU EARN FOREVER</p>
                <p className="text-sm text-muted-foreground">
                  Get paid every month they stay Premium - for life!
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">COMMISSION RATES:</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⭐</span>
                <p className="font-bold">Founding Council (First 100)</p>
              </div>
              <ul className="space-y-1 text-sm ml-8">
                <li>• 10% lifetime commission</li>
                <li>• $2 per Premium referral/month</li>
                <li>• Premium FREE forever</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🥈</span>
                <p className="font-bold">First Movers (Next 900)</p>
              </div>
              <ul className="space-y-1 text-sm ml-8">
                <li>• 5% lifetime commission</li>
                <li>• $1 per Premium referral/month</li>
                <li>• 50% off Premium forever</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="font-bold text-lg">EXAMPLE EARNINGS:</h3>
          </div>

          <p className="text-sm mb-3">
            If you refer 10 people who all upgrade to Premium:
          </p>

          <div className="bg-background/50 rounded-lg p-4 mb-3">
            <p className="font-semibold mb-2">Founding Council: $20/month</p>
            <p className="text-sm text-muted-foreground">(10 × $2 = $20)</p>
          </div>

          <div className="space-y-2 text-sm">
            <p>After 1 year: <span className="font-bold text-success">$240</span></p>
            <p>After 2 years: <span className="font-bold text-success">$480</span></p>
            <p>Lifetime: <span className="font-bold text-success">Unlimited!</span></p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">PAYOUT SCHEDULE:</h3>
          </div>

          <ul className="space-y-2 text-sm">
            <li>• <span className="font-semibold">Calculated:</span> Last day of month</li>
            <li>• <span className="font-semibold">Paid:</span> 15th of following month</li>
            <li>• <span className="font-semibold">Minimum:</span> $20 (rolls over if less)</li>
            <li>• <span className="font-semibold">Methods:</span> Bank, PayPal, VairiPay</li>
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <h3 className="font-bold text-lg mb-4">TIPS FOR SUCCESS:</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ SMS invites convert 3x better</li>
            <li>✅ Personal message = 35% boost</li>
            <li>✅ Follow up after 48 hours</li>
            <li>✅ Share success stories</li>
            <li>✅ Explain safety benefits</li>
          </ul>
        </Card>

        <Button 
          className="w-full h-14 text-lg font-bold"
          onClick={() => navigate('/referrals')}
        >
          Start Referring Now
        </Button>
      </div>
    </div>
  );
}
