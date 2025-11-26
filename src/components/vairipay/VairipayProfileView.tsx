import { useEffect, useState } from "react";
import { ExternalLink, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import vairifyLogo from "@/assets/vairify-logo.png";

interface PaymentApp {
  id: string;
  app_name: string;
  app_category: string;
  download_url_ios: string | null;
  download_url_android: string | null;
}

interface UserPaymentMethod {
  id: string;
  payment_app_id: string;
  preference_order: number;
  qr_code_image_url: string | null;
  username_handle: string | null;
  wallet_address: string | null;
  payment_app: PaymentApp;
}

interface VairipayProfileViewProps {
  userId: string;
  currentUserId?: string;
}

export function VairipayProfileView({ userId, currentUserId }: VairipayProfileViewProps) {
  const [methods, setMethods] = useState<UserPaymentMethod[]>([]);
  const [currentUserMethods, setCurrentUserMethods] = useState<UserPaymentMethod[]>([]);
  const [matchedMethods, setMatchedMethods] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  }, [userId, currentUserId]);

  const fetchMethods = async () => {
    try {
      // Fetch target user's methods
      const { data: targetMethods } = await supabase
        .from("user_payment_methods")
        .select(`
          *,
          payment_app:payment_apps(*)
        `)
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("preference_order");

      if (targetMethods) setMethods(targetMethods as any);

      // Fetch current user's methods if provided
      if (currentUserId) {
        const { data: myMethods } = await supabase
          .from("user_payment_methods")
          .select(`
            *,
            payment_app:payment_apps(*)
          `)
          .eq("user_id", currentUserId)
          .eq("is_active", true);

        if (myMethods) {
          setCurrentUserMethods(myMethods as any);
          
          // Find matches
          const myAppIds = new Set(myMethods.map(m => m.payment_app_id));
          const matches = new Set(
            targetMethods
              ?.filter(m => myAppIds.has(m.payment_app_id))
              .map(m => m.payment_app_id) || []
          );
          setMatchedMethods(matches);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHighestCommonMethod = () => {
    if (!currentUserId || matchedMethods.size === 0) return null;

    // Find the method with lowest preference_order (highest priority) that's matched
    return methods.find(m => matchedMethods.has(m.payment_app_id));
  };

  const generatePaymentLink = (method: UserPaymentMethod): string | null => {
    const appName = method.payment_app.app_name.toLowerCase();
    const appCategory = method.payment_app.app_category.toLowerCase();
    
    // For crypto, return wallet address if available
    if (appCategory.includes('crypto') || appCategory.includes('blockchain')) {
      return method.wallet_address || null;
    }
    
    // For other apps, use username handle
    if (!method.username_handle) return null;
    
    const username = method.username_handle.replace(/^@/, ''); // Remove @ if present
    
    // Map common payment apps to their URL patterns
    if (appName.includes('cash app')) {
      return `https://cash.app/$${username}`;
    } else if (appName.includes('venmo')) {
      return `https://venmo.com/${username}`;
    } else if (appName.includes('paypal')) {
      return `https://paypal.me/${username}`;
    }
    
    return null;
  };

  const isCryptoMethod = (method: UserPaymentMethod): boolean => {
    const category = method.payment_app.app_category.toLowerCase();
    return category.includes('crypto') || category.includes('blockchain');
  };

  const highestMatch = getHighestCommonMethod();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading payment methods...</p>
        </CardContent>
      </Card>
    );
  }

  if (methods.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No payment methods set up yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Highest Match Banner */}
      {currentUserId && highestMatch && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-primary">Best Match</p>
                <p className="text-sm">
                  Both of you have <span className="font-medium">{highestMatch.payment_app.app_name}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">
            {currentUserId ? "Payment Methods (Your preference order)" : "Available Payment Methods"}
          </h3>
          <div className="space-y-3">
            {methods.map((method) => {
              const isMatched = matchedMethods.has(method.payment_app_id);
              const isMissing = currentUserId && !isMatched;
              const isCrypto = isCryptoMethod(method);
              const paymentLink = generatePaymentLink(method);

              // Special crypto display
              if (isCrypto && paymentLink) {
                return (
                  <div
                    key={method.id}
                    className={`flex flex-col items-center justify-center p-6 border rounded-lg ${
                      isMatched ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    {/* Username/VAI # and amount above */}
                    <div className="text-center mb-3">
                      <p className="text-sm font-medium">
                        {method.username_handle || method.wallet_address}
                      </p>
                      {isMatched && (
                        <Badge variant="default" className="text-xs mt-1">
                          <Check className="w-3 h-3 mr-1" />
                          Match
                        </Badge>
                      )}
                    </div>

                    {/* Clickable Vairify Logo */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(paymentLink);
                        // Could show a toast here
                      }}
                      className="relative w-24 h-24 mb-3 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <img 
                        src={vairifyLogo} 
                        alt="Vairify" 
                        className="w-full h-full object-contain"
                      />
                    </a>

                    {/* P2P Crypto text below */}
                    <p className="text-xs text-muted-foreground font-medium">
                      P2P Crypto
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click logo to copy address
                    </p>
                  </div>
                );
              }

              // Regular payment method display
              return (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isMatched ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{method.preference_order}</span>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {method.payment_app.app_name}
                        {isMatched && (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Match
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {method.payment_app.app_category.replace('_', ' ')}
                      </p>
                      {method.username_handle && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {method.username_handle}
                        </p>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const link = generatePaymentLink(method);
                    if (isMatched && link) {
                      return (
                        <Button size="sm" variant="default" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Send Payment
                          </a>
                        </Button>
                      );
                    }
                    
                    if (isMissing) {
                      return (
                        <div className="flex gap-2">
                          {method.payment_app.download_url_ios && (
                            <a
                              href={method.payment_app.download_url_ios}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                iOS
                              </Button>
                            </a>
                          )}
                          {method.payment_app.download_url_android && (
                            <a
                              href={method.payment_app.download_url_android}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Android
                              </Button>
                            </a>
                          )}
                        </div>
                      );
                    }
                    
                    if (!currentUserId && link) {
                      return (
                        <Button size="sm" variant="outline" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Send Payment
                          </a>
                        </Button>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Match Summary */}
      {currentUserId && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {matchedMethods.size > 0
                  ? `${matchedMethods.size} payment ${matchedMethods.size === 1 ? 'method' : 'methods'} in common`
                  : "No payment methods in common - download an app to match"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
