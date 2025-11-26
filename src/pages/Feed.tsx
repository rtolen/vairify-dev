import { Header } from "@/components/feed/Header";
import { BottomNavigation } from "@/components/feed/BottomNavigation";
import { EmergencyButton } from "@/components/feed/EmergencyButton";
import ReferralEarningsCard from "@/components/referral/ReferralEarningsCard";
import { AvailableNowToggle } from "@/components/profile/AvailableNowToggle";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { 
  CheckCircle, 
  Shield, 
  Star, 
  Camera, 
  TrendingUp, 
  Eye,
  Award,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import veniceBridge from "@/assets/venice-bridge.jpg";
import vairifyLogo from "@/assets/vairify-logo.png";

export default function Feed() {
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Profile Completion Card */}
        <ProfileCompletionCard />
        
        {/* Personal Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            👋 {greeting}, Sarah
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Founding Member Council 🚀 Rocket Base
            <Badge variant="secondary" className="text-xs">FOUNDING</Badge>
          </p>
        </div>

        {/* Safety Status Card */}
        <Card className="border-accent/20 bg-gradient-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                🎯 Your Safety Status
              </h2>
              <Badge className="bg-success text-success-foreground">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs font-medium text-foreground">V.A.I. VERIFIED</span>
                </div>
                <p className="text-xs font-semibold text-foreground">#9I7T35L</p>
              </div>

              <div className="p-3 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium text-foreground">TrueRevu</span>
                </div>
                <p className="text-xs text-muted-foreground">No reviews yet</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline"
                className="flex-col h-24 gap-1 justify-center"
                onClick={() => window.location.href = "/dateguard"}
              >
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-xs font-semibold">DateGuard</span>
                <span className="text-xs text-muted-foreground">Set Up</span>
              </Button>

              <Button 
                className="flex-col h-24 gap-1 justify-center bg-gradient-primary hover:opacity-90"
                onClick={() => window.location.href = "/vai-check"}
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-semibold">VAI Check</span>
                <span className="text-xs opacity-80">Verify ID</span>
              </Button>

              <Button 
                className="flex-col h-24 gap-1 justify-center bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                onClick={() => window.location.href = "/available-now"}
              >
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-semibold">Available Now</span>
                <span className="text-xs opacity-80">Go Live</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Hub Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">💬 Social Hub</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Requests</p>
            </Card>
          </div>

          {/* Feed Preview Post */}
          <Sheet>
            <SheetTrigger asChild>
              <Card className="cursor-pointer animate-fade-in border-border overflow-hidden hover:border-primary/50 transition-colors mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          Jessica M.
                          <CheckCircle className="w-4 h-4 text-success" />
                        </p>
                        <p className="text-xs text-muted-foreground">Venice, Italy • 2h ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">•••</Button>
                  </div>
                </CardHeader>
                <div className="aspect-square relative overflow-hidden">
                  <img src={veniceBridge} alt="Venice Bridge" className="w-full h-full object-cover" />
                </div>
                <CardContent className="pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 hover-scale">
                        <Star className="w-5 h-5 text-foreground" />
                      </button>
                      <button className="flex items-center gap-1 hover-scale">
                        <Eye className="w-5 h-5 text-foreground" />
                      </button>
                      <button className="flex items-center gap-1 hover-scale">
                        <TrendingUp className="w-5 h-5 text-foreground" />
                      </button>
                    </div>
                    <Badge variant="secondary" className="text-xs">Available Now</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">342 likes</p>
                    <p className="text-sm text-foreground mt-1">
                      <span className="font-semibold">Jessica M.</span> Venice is nice this time of year 🌉✨
                    </p>
                    <button className="text-xs text-muted-foreground mt-1">View all 28 comments</button>
                    <p className="text-xs text-muted-foreground mt-1">2 HOURS AGO</p>
                  </div>
                </CardContent>
                <p className="text-xs text-center text-muted-foreground p-3 border-t">Tap to see more posts</p>
              </Card>
            </SheetTrigger>

            <SheetContent side="bottom" className="h-[95vh] p-0">
              <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
                <SheetTitle>Social Feed</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-full pb-20 px-4 pt-4 space-y-4">
                {/* Venice Post in Feed */}
                <Card className="animate-fade-in border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500"></div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            Jessica M.
                            <CheckCircle className="w-4 h-4 text-success" />
                          </p>
                          <p className="text-xs text-muted-foreground">Venice, Italy • 2h ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">•••</Button>
                    </div>
                  </CardHeader>
                  <div className="aspect-square relative overflow-hidden">
                    <img src={veniceBridge} alt="Venice Bridge" className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 hover-scale">
                          <Star className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <Eye className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <TrendingUp className="w-5 h-5 text-foreground" />
                        </button>
                      </div>
                      <Badge variant="secondary" className="text-xs">Available Now</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">342 likes</p>
                      <p className="text-sm text-foreground mt-1">
                        <span className="font-semibold">Jessica M.</span> Venice is nice this time of year 🌉✨
                      </p>
                      <button className="text-xs text-muted-foreground mt-1">View all 28 comments</button>
                      <p className="text-xs text-muted-foreground mt-1">2 HOURS AGO</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional feed posts */}
                <Card className="animate-fade-in border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            Sarah K.
                            <CheckCircle className="w-4 h-4 text-success" />
                          </p>
                          <p className="text-xs text-muted-foreground">Miami, FL • 5h ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">•••</Button>
                    </div>
                  </CardHeader>
                  <div className="aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/30" />
                    </div>
                  </div>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 hover-scale">
                          <Star className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <Eye className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <TrendingUp className="w-5 h-5 text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">234 likes</p>
                      <p className="text-sm text-foreground mt-1">
                        <span className="font-semibold">Sarah K.</span> Beach vibes 🌊 Perfect day in Miami!
                      </p>
                      <button className="text-xs text-muted-foreground mt-1">View all 45 comments</button>
                      <p className="text-xs text-muted-foreground mt-1">5 HOURS AGO</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-fade-in border-border overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            Emma R.
                            <CheckCircle className="w-4 h-4 text-success" />
                          </p>
                          <p className="text-xs text-muted-foreground">Los Angeles, CA • 1d ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">•••</Button>
                    </div>
                  </CardHeader>
                  <div className="aspect-square bg-gradient-to-br from-green-400 to-emerald-400 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/30" />
                    </div>
                  </div>
                  <CardContent className="pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 hover-scale">
                          <Star className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <Eye className="w-5 h-5 text-foreground" />
                        </button>
                        <button className="flex items-center gap-1 hover-scale">
                          <TrendingUp className="w-5 h-5 text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">189 likes</p>
                      <p className="text-sm text-foreground mt-1">
                        <span className="font-semibold">Emma R.</span> Just completed my 50th verified encounter! #VAIrify
                      </p>
                      <button className="text-xs text-muted-foreground mt-1">View all 31 comments</button>
                      <p className="text-xs text-muted-foreground mt-1">1 DAY AGO</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>

          {/* VAIrify Official Post */}
          <Card className="animate-fade-in border-accent/30 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      VAIrify Official
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </p>
                    <p className="text-xs text-muted-foreground">Announcement • 2h ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">•••</Button>
              </div>
            </CardHeader>

            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-8 flex items-center justify-center">
              <div className="text-center space-y-4">
                <img src={vairifyLogo} alt="VAIrify" className="w-24 h-24 mx-auto object-contain" />
                <div>
                  <p className="text-4xl font-bold text-foreground">20,000+</p>
                  <p className="text-lg text-muted-foreground mt-1">Community Members</p>
                </div>
              </div>
            </div>

            <CardContent className="pt-3 space-y-3">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 hover-scale">
                  <Star className="w-5 h-5 text-foreground" />
                </button>
                <button className="flex items-center gap-1 hover-scale">
                  <Eye className="w-5 h-5 text-foreground" />
                </button>
                <button className="flex items-center gap-1 hover-scale">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">1.2K likes</p>
                <p className="text-sm text-foreground mt-1">
                  <span className="font-semibold">VAIrify Official</span> 🎉 We've reached 20,000 community members! Thank you for trusting VAIrify to keep you safe.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Bulletin Board */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">📌 Community Bulletin</h2>
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">New Safety Features Released</p>
                  <p className="text-xs text-muted-foreground mt-1">Enhanced DateGuard now includes real-time location sharing • 2h ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Community Milestone</p>
                  <p className="text-xs text-muted-foreground mt-1">10,000 verified encounters completed safely! • 5h ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Referral Program Update</p>
                  <p className="text-xs text-muted-foreground mt-1">New tier structure with increased commissions • 1d ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ReferralEarningsCard />
            
        <Card 
          className="hover-scale cursor-pointer border-2 border-purple-500/30 bg-gradient-to-br from-purple-600/10 to-pink-600/10 hover:border-purple-500 hover:shadow-lg transition-all group"
          onClick={() => window.location.href = "/apply/influencer"}
        >
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-purple-500/50 transition-shadow flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm">BECOME AN INFLUENCER</p>
                <p className="text-xs text-muted-foreground mt-0.5">Earn higher commissions & exclusive perks</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </main>

      <EmergencyButton />
      <BottomNavigation activeTab="feed" />
    </div>
  );
}
