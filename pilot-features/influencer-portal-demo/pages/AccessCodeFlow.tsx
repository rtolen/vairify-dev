import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AccessCodeFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [accessCode, setAccessCode] = useState(codeFromUrl || "");
  const [validating, setValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeData, setCodeData] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (codeFromUrl) {
      validateCode();
    }
  }, [codeFromUrl]);

  const validateCode = async () => {
    if (!accessCode.trim()) return;

    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-access-code', {
        body: { code: accessCode.trim() }
      });

      if (error) throw error;

      if (data?.valid) {
        setCodeValid(true);
        setCodeData(data);
      } else {
        setCodeValid(false);
        toast.error(data?.error || "Invalid or expired access code");
      }
    } catch (error: any) {
      console.error('Error validating code:', error);
      setCodeValid(false);
      toast.error(error.message || "Failed to validate access code");
    } finally {
      setValidating(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Validate passwords
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setCreating(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        setCreating(false);
        return;
      }

      // Create influencer account with access code
      const { data, error } = await supabase.functions.invoke('create-influencer-from-access-code', {
        body: {
          access_code: accessCode,
          email: formData.email,
          username: formData.username,
          password: formData.password
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Account created! Redirecting to login...");
        // TODO: Auto-login or redirect to login
        navigate("/influencers/login");
      } else {
        throw new Error(data?.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/influencers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Access Code Setup</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Code Validation Step */}
        {codeValid === null && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Access Code</CardTitle>
              <CardDescription>
                If you have an access code from Vairify, enter it here to skip the application process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="ADVOCATE-XYZ123"
                  className="text-center text-lg font-mono"
                />
              </div>

              <Button
                onClick={validateCode}
                disabled={!accessCode.trim() || validating}
                className="w-full"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Code"
                )}
              </Button>

              {codeValid === false && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invalid or expired access code. Please check your code and try again.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Creation Step */}
        {codeValid === true && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <CardTitle>Access Code Validated</CardTitle>
              </div>
              <CardDescription>
                Create your influencer account. Your application will be automatically approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    required
                    placeholder="yourusername"
                    pattern="[a-z0-9_]+"
                    minLength={3}
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your account will be automatically approved and you'll have immediate access to the influencer dashboard.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCodeValid(null);
                      setAccessCode("");
                    }}
                    disabled={creating}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


