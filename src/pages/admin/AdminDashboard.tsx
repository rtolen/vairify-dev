import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, Shield, Activity, Settings, Database, Monitor, Mail, FileText, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useIsAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Search, view, and manage all users",
      icon: Users,
      path: "/admin/users",
      color: "from-blue-500/10 to-cyan-500/10"
    },
    {
      title: "Influencer & Affiliates",
      description: "Manage applications and Founding Council",
      icon: Users,
      path: "/admin/influencers",
      color: "from-purple-500/10 to-violet-500/10"
    },
    {
      title: "Coupon Generator",
      description: "Create promotional and founding member codes",
      icon: DollarSign,
      path: "/admin/coupons",
      color: "from-yellow-500/10 to-amber-500/10"
    },
    {
      title: "Referral System",
      description: "Monitor referrals, earnings, and payouts",
      icon: DollarSign,
      path: "/admin/referrals",
      color: "from-green-500/10 to-emerald-500/10"
    },
    {
      title: "Country Representatives",
      description: "Manage country rep competitions and leaderboard",
      icon: Trophy,
      path: "/admin/country-reps",
      color: "from-yellow-500/10 to-orange-500/10"
    },
    {
      title: "V.A.I. Check Sessions",
      description: "View all verification sessions",
      icon: Shield,
      path: "/admin/vai-sessions",
      color: "from-purple-500/10 to-pink-500/10"
    },
    {
      title: "DateGuard Sessions",
      description: "Monitor active and past safety sessions",
      icon: Activity,
      path: "/admin/dateguard-sessions",
      color: "from-orange-500/10 to-red-500/10"
    },
    {
      title: "Pricing Controls",
      description: "Manage subscription tiers and rates",
      icon: Settings,
      path: "/admin/pricing",
      color: "from-indigo-500/10 to-blue-500/10"
    },
    {
      title: "System Monitor",
      description: "Real-time errors, network, and database tracking",
      icon: Monitor,
      path: "/admin/system-monitor",
      color: "from-red-500/10 to-rose-500/10"
    },
    {
      title: "Email Notifications Test",
      description: "Test email notification system and RESEND integration",
      icon: Mail,
      path: "/admin/email-test",
      color: "from-pink-500/10 to-fuchsia-500/10"
    },
    {
      title: "Email Logs Viewer",
      description: "View email sending logs, successes, and failures",
      icon: FileText,
      path: "/admin/email-logs",
      color: "from-violet-500/10 to-purple-500/10"
    },
    {
      title: "Platform Analytics",
      description: "View platform stats and metrics",
      icon: Database,
      path: "/admin/analytics",
      color: "from-cyan-500/10 to-teal-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your platform</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.path}
                className={`p-6 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br ${section.color}`}
                onClick={() => navigate(section.path)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
