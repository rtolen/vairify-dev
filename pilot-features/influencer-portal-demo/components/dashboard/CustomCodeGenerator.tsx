import { useState, useEffect } from "react";
import { Code, CheckCircle, XCircle, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomCodeGeneratorProps {
  influencerId: string;
}

export const CustomCodeGenerator = ({ influencerId }: CustomCodeGeneratorProps) => {
  const [customCode, setCustomCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCodes();
  }, [influencerId]);

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('influencer_custom_codes')
        .select('*')
        .eq('influencer_id', influencerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error loading codes:', error);
      toast.error("Failed to load codes");
    } finally {
      setLoading(false);
    }
  };

  const validateCode = (code: string) => {
    // 3-30 characters, alphanumeric + hyphens
    const regex = /^[a-zA-Z0-9-]{3,30}$/;
    return regex.test(code);
  };

  const checkAvailability = async () => {
    if (!customCode.trim()) return;

    if (!validateCode(customCode)) {
      toast.error("Code must be 3-30 characters, alphanumeric and hyphens only");
      setAvailable(false);
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('influencer_custom_codes')
        .select('id')
        .eq('custom_code', customCode.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAvailable(false);
        toast.error("This code is already taken");
      } else {
        setAvailable(true);
        toast.success("Code is available!");
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error("Failed to check availability");
    } finally {
      setChecking(false);
    }
  };

  const generateCode = async () => {
    if (!available || !customCode.trim()) {
      toast.error("Please check code availability first");
      return;
    }

    setGenerating(true);
    try {
      const fullCode = `VAI-${customCode}`;

      // Create code record
      const { data: codeData, error: createError } = await supabase
        .from('influencer_custom_codes')
        .insert({
          influencer_id: influencerId,
          custom_code: customCode.toLowerCase(),
          full_code: fullCode,
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;

      // Generate QR code via edge function
      const { data: qrData, error: qrError } = await supabase.functions.invoke('generate-qr-code', {
        body: {
          custom_code_id: codeData.id,
          code: fullCode,
          referral_url: `https://vairify.com/join/${customCode.toLowerCase()}`
        }
      });

      if (qrError) {
        console.error('QR generation error:', qrError);
        // Continue even if QR fails
      } else if (qrData?.qr_code_url) {
        // Update code with QR URL
        await supabase
          .from('influencer_custom_codes')
          .update({ qr_code_url: qrData.qr_code_url })
          .eq('id', codeData.id);
      }

      toast.success("Custom code created successfully!");
      setCustomCode("");
      setAvailable(null);
      loadCodes();
    } catch (error: any) {
      console.error('Error generating code:', error);
      toast.error(error.message || "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Create Custom Code
          </CardTitle>
          <CardDescription>
            Create your own branded referral code (e.g., "TimmyDoesDallas" becomes "VAI-TimmyDoesDallas")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customCode">Custom Code</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                  VAI-
                </span>
                <Input
                  id="customCode"
                  value={customCode}
                  onChange={(e) => {
                    setCustomCode(e.target.value.toLowerCase());
                    setAvailable(null);
                  }}
                  placeholder="yourname"
                  className="pl-12 font-mono"
                  maxLength={30}
                />
              </div>
              <Button
                onClick={checkAvailability}
                disabled={!customCode.trim() || checking}
                variant="outline"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Check"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              3-30 characters, alphanumeric and hyphens only
            </p>
            {available === true && (
              <Alert className="border-success/50 bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Code is available! Preview: <code className="font-mono font-bold">VAI-{customCode}</code>
                </AlertDescription>
              </Alert>
            )}
            {available === false && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This code is already taken. Please choose another.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={generateCode}
            disabled={!available || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Code"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Custom Codes</CardTitle>
          <CardDescription>
            Manage and track performance of your referral codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No custom codes yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <Card key={code.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-lg font-mono font-bold">{code.full_code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCode(code.full_code)}
                            className="h-6 w-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Signups</p>
                            <p className="font-bold">{code.total_signups || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-bold">{code.total_conversions || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Earnings</p>
                            <p className="font-bold text-success">${code.total_earnings?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </div>
                      {code.qr_code_url && (
                        <div className="ml-4">
                          <img
                            src={code.qr_code_url}
                            alt={`QR code for ${code.full_code}`}
                            className="w-20 h-20 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


