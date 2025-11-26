import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Sparkles, Star, MapPin, TrendingUp, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNavigation } from "@/components/feed/BottomNavigation";
import { GoldenRosesPurchaseDialog } from "@/components/marketplace/GoldenRosesPurchaseDialog";
import { SearchFilters, SearchFilterOptions } from "@/components/search/SearchFilters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VAIStatusBadge } from "@/components/vai/VAIStatusBadge";

interface Provider {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  age_range: string | null;
  services_offered: any;
  profile_completion_percentage: number;
  profiles?: {
    subscription_status: string | null;
    full_name: string | null;
  };
  vai_number?: string;
}

interface DirectoryBoost {
  id: string;
  user_id: string;
  boost_type: string;
  boost_position: number | null;
  boost_expires_at: string | null;
}

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [boosts, setBoosts] = useState<DirectoryBoost[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterOptions>({});

  useEffect(() => {
    loadProviders();
    loadBoosts();
  }, [searchQuery, filters]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      
      // First get provider profiles
      let query = supabase
        .from("provider_profiles")
        .select("*")
        .eq("profile_settings->>visibleInDirectory", "true");

      if (searchQuery) {
        query = query.ilike("username", `%${searchQuery}%`);
      }

      // Apply filters
      if (filters.ageRange) {
        query = query.eq("age_range", filters.ageRange);
      }

      if (filters.availability === "available_now") {
        query = query.eq("available_now", true);
      }

      if (filters.verified) {
        query = query.eq("is_verified", true);
      }

      const { data: providerData, error: providerError } = await query;
      if (providerError) throw providerError;

      let filteredProviders = providerData || [];

      // Filter by V.A.I. verification if requested
      if (filters.vaiVerified && filteredProviders.length > 0) {
        const userIds = filteredProviders.map(p => p.user_id);
        const { data: vaiData } = await supabase
          .from("vai_verifications")
          .select("user_id")
          .in("user_id", userIds);
        
        const verifiedUserIds = new Set(vaiData?.map(v => v.user_id) || []);
        filteredProviders = filteredProviders.filter(p => verifiedUserIds.has(p.user_id));
      }

      // Then get profiles for these users
      if (filteredProviders.length > 0) {
        const userIds = filteredProviders.map(p => p.user_id);
        
        // Get profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, subscription_status, full_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Get V.A.I. data
        const { data: vaiData } = await supabase
          .from("vai_verifications")
          .select("user_id, vai_number")
          .in("user_id", userIds);

        // Merge the data
        const mergedData = filteredProviders.map(provider => {
          const profile = profilesData?.find(p => p.id === provider.user_id);
          const vai = vaiData?.find(v => v.user_id === provider.user_id);
          return {
            ...provider,
            profiles: profile ? {
              subscription_status: profile.subscription_status,
              full_name: profile.full_name
            } : undefined,
            vai_number: vai?.vai_number
          };
        });

        setProviders(mergedData as Provider[]);
      } else {
        setProviders([]);
      }
    } catch (error: any) {
      console.error("Error loading providers:", error);
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  const loadBoosts = async () => {
    try {
      const { data, error } = await supabase
        .from("directory_boosts")
        .select("*")
        .gte("boost_expires_at", new Date().toISOString())
        .order("boost_position", { ascending: true });

      if (error) throw error;
      setBoosts(data || []);
    } catch (error: any) {
      console.error("Error loading boosts:", error);
    }
  };

  const getPremiumProviders = () => {
    return providers.filter(
      (p) => p.profiles?.subscription_status === "premium"
    );
  };

  const getBoostedProviders = () => {
    const boostedUserIds = boosts.map((b) => b.user_id);
    return providers
      .filter((p) => boostedUserIds.includes(p.user_id))
      .sort((a, b) => {
        const aBoost = boosts.find((b) => b.user_id === a.user_id);
        const bBoost = boosts.find((b) => b.user_id === b.user_id);
        return (aBoost?.boost_position || 999) - (bBoost?.boost_position || 999);
      });
  };

  const getRegularProviders = () => {
    const premiumIds = getPremiumProviders().map((p) => p.user_id);
    const boostedIds = getBoostedProviders().map((p) => p.user_id);
    return providers.filter(
      (p) => !premiumIds.includes(p.user_id) && !boostedIds.includes(p.user_id)
    );
  };

  const premiumProviders = getPremiumProviders();
  const boostedProviders = getBoostedProviders();
  const regularProviders = getRegularProviders();

  const renderProviderCard = (provider: Provider, isPremium = false, isSpotlight = false) => {
    const boost = boosts.find((b) => b.user_id === provider.user_id);
    const displayName = provider.profiles?.full_name || provider.username;

    return (
      <Card
        key={provider.id}
        className={`p-5 cursor-pointer transition-all hover:shadow-xl ${
          isSpotlight ? "border-2 border-yellow-500 shadow-lg" : isPremium ? "border-primary/50" : ""
        }`}
        onClick={() => navigate(`/profile/${provider.user_id}`)}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={provider.avatar_url || ""} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isPremium && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-1">
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-lg truncate">{displayName}</h3>
              {provider.vai_number && (
                <VAIStatusBadge 
                  isVerified={true}
                  vaiNumber={provider.vai_number}
                  size="sm"
                  showNumber={false}
                />
              )}
              {provider.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Verified
                </Badge>
              )}
              {isSpotlight && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Spotlight
                </Badge>
              )}
              {boost && boost.boost_type === "premium" && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-500 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Boosted
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {provider.age_range || "Age not specified"}
            </p>

            {provider.services_offered && Array.isArray(provider.services_offered) && (
              <div className="flex flex-wrap gap-1 mb-3">
                {provider.services_offered.slice(0, 3).map((service: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service.name || service}
                  </Badge>
                ))}
                {provider.services_offered.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.services_offered.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">4.8</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {provider.profile_completion_percentage}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setPurchaseDialogOpen(true)}
              className="h-12 w-12"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse flex gap-4">
                      <div className="h-20 w-20 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-muted rounded w-20"></div>
                          <div className="h-6 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : providers.length === 0 ? (
              <Card className="p-12 text-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No providers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setFilters({}); }}>
                  Clear Search
                </Button>
              </Card>
            ) : (
              <>
                {/* Premium Providers */}
                {premiumProviders.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Premium Members
                      </h2>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        Featured
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {premiumProviders.map((provider) => {
                        const boost = boosts.find((b) => b.user_id === provider.user_id);
                        const isSpotlight = boost?.boost_type === "spotlight";
                        return renderProviderCard(provider, true, isSpotlight);
                      })}
                    </div>
                  </section>
                )}

                {/* Boosted Providers */}
                {boostedProviders.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">Featured</h2>
                    </div>
                    <div className="space-y-3">
                      {boostedProviders.map((provider) => {
                        const boost = boosts.find((b) => b.user_id === provider.user_id);
                        const isSpotlight = boost?.boost_type === "spotlight";
                        return renderProviderCard(provider, false, isSpotlight);
                      })}
                    </div>
                  </section>
                )}

                {/* Regular Providers */}
                {regularProviders.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4">All Providers</h2>
                    <div className="space-y-3">
                      {regularProviders.map((provider) => renderProviderCard(provider))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation activeTab="search" />

      <GoldenRosesPurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onPurchaseComplete={() => {
          loadProviders();
          loadBoosts();
        }}
      />
    </div>
  );
}
