import { useState } from "react";
import { Bell, Shield, User, Crown, Settings, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PremiumUpgradeDialog } from "./PremiumUpgradeDialog";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import { useNotifications } from "@/hooks/useNotifications";

export const Header = () => {
  const navigate = useNavigate();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { hasPendingNotification, clearNotification } = useApplicationStatus();
  const { unreadCount } = useNotifications();

  const handleSettingsClick = () => {
    clearNotification();
    navigate("/settings");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <img 
              src="/src/assets/vairify-logo.png" 
              alt="Logo" 
              className="h-8 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/available-now")}
              className="flex items-center gap-1.5 text-xs font-medium border-green-500/50 hover:border-green-500 hover:bg-green-500/10"
            >
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              <span className="hidden sm:inline">Available Now</span>
              <span className="inline sm:hidden">Now</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </Button>

            <ThemeToggle />
            
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Badge className="w-5 h-5 bg-primary text-primary-foreground" />
            </button>
            
            <button 
              onClick={() => navigate("/notifications")}
              className="p-2 hover:bg-accent rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-full transition-colors">
                  <User className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowPremiumDialog(true)}>
                  <Crown className="w-4 h-4 mr-2 text-warning" />
                  Upgrade to Premium
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <div className="relative">
                    <Settings className="w-4 h-4 mr-2" />
                    {hasPendingNotification && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </div>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PremiumUpgradeDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
      />
    </>
  );
};
