import { Home, MessageCircle, Shield, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavigationProps {
  activeTab: "feed" | "chat" | "vai" | "search" | "profile";
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();

  const tabs = [
    { id: "feed", icon: Home, label: "Feed", path: "/feed" },
    { id: "chat", icon: MessageCircle, label: "Chat", path: "/chat" },
    { id: "vai", icon: Shield, label: "VAI", path: "/vai-check/show-qr", isCenter: true },
    { id: "search", icon: Search, label: "Search", path: "/search" },
    { id: "profile", icon: User, label: "Profile", path: "/profile-creation" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCenter = tab.isCenter;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              } ${isCenter ? "-mt-6" : ""}`}
            >
              {isCenter ? (
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <Icon className={`w-6 h-6 ${isActive ? "text-primary" : ""}`} />
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
