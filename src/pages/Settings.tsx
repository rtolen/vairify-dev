import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import MembershipSettings from "@/components/settings/MembershipSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import AccountSettings from "@/components/settings/AccountSettings";
import VAISettings from "@/components/settings/VAISettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="vai">V.A.I.</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="vai" className="space-y-4">
            <VAISettings />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="membership" className="space-y-4">
            <MembershipSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
