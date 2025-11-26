import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type CouponTier = 'founding_council' | 'first_movers' | 'early_access' | 'promotional';

interface GeneratedCoupon {
  code: string;
  tier: CouponTier;
  prefix: string;
  number: number;
}

export default function CouponGenerator() {
  const navigate = useNavigate();
  const [tier, setTier] = useState<CouponTier>('promotional');
  const [startNumber, setStartNumber] = useState<string>('1');
  const [count, setCount] = useState<string>('10');
  const [generatedCoupons, setGeneratedCoupons] = useState<GeneratedCoupon[]>([]);

  const tierPrefixes: Record<CouponTier, string> = {
    founding_council: 'FC',
    first_movers: 'FM',
    early_access: 'EA',
    promotional: 'PR',
  };

  const tierNames: Record<CouponTier, string> = {
    founding_council: 'Founding Council (FC)',
    first_movers: 'First Movers (FM)',
    early_access: 'Early Access (EA)',
    promotional: 'Promotional (PR)',
  };

  const generateCoupons = () => {
    const prefix = tierPrefixes[tier];
    const start = parseInt(startNumber);
    const total = parseInt(count);

    if (isNaN(start) || isNaN(total) || start < 1 || total < 1 || total > 1000) {
      toast.error("Invalid input. Start number must be ≥1 and count between 1-1000");
      return;
    }

    const coupons: GeneratedCoupon[] = [];
    for (let i = 0; i < total; i++) {
      const num = start + i;
      const code = `${prefix}${num.toString().padStart(4, '0')}`;
      coupons.push({ code, tier, prefix, number: num });
    }

    setGeneratedCoupons(coupons);
    toast.success(`Generated ${total} coupon codes`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const copyAllCodes = () => {
    const allCodes = generatedCoupons.map(c => c.code).join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success(`Copied ${generatedCoupons.length} codes to clipboard`);
  };

  const downloadCSV = () => {
    const csv = [
      'Code,Tier,Prefix,Number',
      ...generatedCoupons.map(c => `${c.code},${c.tier},${c.prefix},${c.number}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vairify-coupons-${tierPrefixes[tier]}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Downloaded CSV file");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Coupon Code Generator</h1>
            <p className="text-muted-foreground mt-1">Create promotional and founding member codes</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Generator Form */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Generate Codes</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Tier Type</Label>
              <Select value={tier} onValueChange={(value) => setTier(value as CouponTier)}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founding_council">{tierNames.founding_council}</SelectItem>
                  <SelectItem value="first_movers">{tierNames.first_movers}</SelectItem>
                  <SelectItem value="early_access">{tierNames.early_access}</SelectItem>
                  <SelectItem value="promotional">{tierNames.promotional}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startNumber">Start Number</Label>
                <Input
                  id="startNumber"
                  type="number"
                  min="1"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Count (max 1000)</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <Button onClick={generateCoupons} className="w-full">
              Generate Codes
            </Button>
          </div>
        </Card>

        {/* Generated Codes */}
        {generatedCoupons.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Generated Codes ({generatedCoupons.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAllCodes}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {generatedCoupons.map((coupon, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <code className="font-mono font-bold text-lg">{coupon.code}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(coupon.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-muted/30">
          <h3 className="font-bold mb-3">Coupon Code Formats</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>FC####</strong> - Founding Council (Free lifetime premium)</li>
            <li><strong>FM####</strong> - First Movers (Free 2 years)</li>
            <li><strong>EA####</strong> - Early Access (Free 1 year)</li>
            <li><strong>PR####</strong> - Promotional codes (custom discounts)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
