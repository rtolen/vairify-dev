import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Lock, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Encounter {
  id: string;
  session_id: string;
  provider_id: string;
  client_id: string;
  status: string;
  accepted_at: string;
  dateguard_window_open: boolean;
  dateguard_window_closed_at: string | null;
  reviews_window_closed_reason: string | null;
  reviews_published_at: string | null;
}

interface WindowStatus {
  can_activate: boolean;
  reason: string;
  days_remaining: number;
}

interface EncounterWithStatus extends Encounter {
  windowStatus?: WindowStatus;
  encounterNumber?: string;
}

export default function DateGuardActivate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"activate" | "active" | "history">("activate");
  const [encounters, setEncounters] = useState<EncounterWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        navigate("/login");
        return;
      }

      // Fetch encounters for this user
      const { data: encountersData, error } = await supabase
        .from('encounters')
        .select('*')
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .order('accepted_at', { ascending: false });

      if (error) throw error;

      if (encountersData) {
        // Check window status for each encounter
        const encountersWithStatus = await Promise.all(
          encountersData.map(async (encounter, index) => {
            const { data: statusData } = await supabase
              .rpc('can_activate_dateguard', { p_encounter_id: encounter.id });

            return {
              ...encounter,
              windowStatus: statusData?.[0] as WindowStatus,
              encounterNumber: `ENC-${String(index + 12340).padStart(5, '0')}`
            };
          })
        );

        setEncounters(encountersWithStatus);
      }
    } catch (error) {
      console.error('Error fetching encounters:', error);
      toast.error("Failed to load encounters");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (encounterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Check if window is still open
      const { data: statusData } = await supabase
        .rpc('can_activate_dateguard', { p_encounter_id: encounterId });

      const status = statusData?.[0] as WindowStatus;

      if (!status?.can_activate) {
        toast.error(status?.reason || "Cannot activate DateGuard");
        return;
      }

      // Navigate to activation flow
      navigate(`/dateguard/activate/${encounterId}`);
    } catch (error) {
      console.error('Error activating DateGuard:', error);
      toast.error("Failed to activate DateGuard");
    }
  };

  const readyToActivate = encounters.filter(e => e.windowStatus?.can_activate);
  const windowClosed = encounters.filter(e => !e.windowStatus?.can_activate);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p>Loading encounters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      {/* Header */}
      <header className="sticky top-0 bg-[#0A1628]/95 backdrop-blur-sm border-b border-white/10 px-4 py-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">DATEGUARD</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex gap-2 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("activate")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "activate"
                ? "bg-purple-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Activate
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "active"
                ? "bg-purple-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === "history"
                ? "bg-purple-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {activeTab === "activate" && (
          <>
            {/* Ready to Activate Section */}
            {readyToActivate.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  READY TO ACTIVATE ({readyToActivate.length})
                </h2>

                {readyToActivate.map((encounter) => (
                  <div
                    key={encounter.id}
                    className="bg-white/5 rounded-xl p-6 space-y-4 border border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">Encounter {encounter.encounterNumber}</h3>
                        <p className="text-sm text-white/60">V.A.I.-CHECK Completed</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>V.A.I.-CHECK completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Contract signed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/60" />
                        <span>
                          Started: {format(new Date(encounter.accepted_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Status:</span>
                        <span className="capitalize">{encounter.status}</span>
                      </div>
                    </div>

                    {encounter.windowStatus && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-400">
                            Activation available
                          </p>
                          <p className="text-xs text-white/60">
                            {encounter.windowStatus.days_remaining} days remaining
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleActivate(encounter.id)}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold"
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      ACTIVATE NOW
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Window Closed Section */}
            {windowClosed.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-400" />
                  ACTIVATION WINDOW CLOSED ({windowClosed.length})
                </h2>

                {windowClosed.map((encounter) => (
                  <div
                    key={encounter.id}
                    className="bg-white/5 rounded-xl p-6 space-y-4 border border-orange-400/30 opacity-75"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-600/20 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">Encounter {encounter.encounterNumber}</h3>
                        <p className="text-sm text-orange-400">⚠️ Cannot activate</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {encounter.reviews_window_closed_reason === 'reviews_posted' ? (
                        <>
                          <p className="text-white/80">Reviews already posted</p>
                          {encounter.reviews_published_at && (
                            <p className="text-white/60">
                              Published: {format(new Date(encounter.reviews_published_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-white/80">7-day deadline passed</p>
                      )}
                      {encounter.dateguard_window_closed_at && (
                        <p className="text-white/60">
                          Window closed: {format(new Date(encounter.dateguard_window_closed_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    <Button
                      disabled
                      className="w-full h-12 bg-gray-600 text-white font-semibold opacity-50 cursor-not-allowed"
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      ACTIVATE NOW
                    </Button>

                    <div className="bg-background/10 rounded-lg p-3 text-xs text-white/70">
                      <p className="font-medium text-white/90 mb-1">💡 DateGuard must be activated before reviews</p>
                      <p>Activation is only available while the review window is open (up to 7 days).</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {encounters.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold mb-2">No Encounters Yet</h3>
                <p className="text-white/60 mb-6">
                  Complete a V.A.I.-CHECK to activate DateGuard protection
                </p>
                <Button
                  onClick={() => navigate('/vai-check')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  Start V.A.I.-CHECK
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === "active" && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">No Active Sessions</h3>
            <p className="text-white/60">
              Your active DateGuard sessions will appear here
            </p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold mb-2">No Session History</h3>
            <p className="text-white/60">
              Your completed DateGuard sessions will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
