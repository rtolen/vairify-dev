import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Lock, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EncounterWindow {
  can_activate: boolean;
  reason: string;
  days_remaining: number;
}

export default function Complete() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [windowStatus, setWindowStatus] = useState<EncounterWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingEncounter, setCreatingEncounter] = useState(false);
  const [encounter, setEncounter] = useState<any>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);

  useEffect(() => {
    initializeEncounter();
  }, [sessionId]);

  const initializeEncounter = async () => {
    if (!sessionId) return;

    try {
      // Load session
      const { data: session, error: sessionError } = await supabase
        .from('vai_check_sessions')
        .select('encounter_id, status')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // If encounter already exists, use it
      if (session.encounter_id) {
        setEncounterId(session.encounter_id);
        loadEncounterDetails(session.encounter_id);
        return;
      }

      // If session is completed, create encounter
      if (session.status === 'completed') {
        await createEncounter();
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error initializing encounter:', error);
      toast.error(error.message || "Failed to load session");
      setLoading(false);
    }
  };

  const createEncounter = async () => {
    if (!sessionId) return;

    setCreatingEncounter(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-encounter', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data?.success && data?.encounter_id) {
        setEncounterId(data.encounter_id);
        await loadEncounterDetails(data.encounter_id);
        toast.success("Encounter created successfully!");
      } else {
        throw new Error(data?.error || 'Failed to create encounter');
      }
    } catch (error: any) {
      console.error('Error creating encounter:', error);
      toast.error(error.message || "Failed to create encounter");
    } finally {
      setCreatingEncounter(false);
      setLoading(false);
    }
  };

  const loadEncounterDetails = async (encounterId: string) => {
    try {
      const { data: encounterData, error } = await supabase
        .from('encounters')
        .select('*')
        .eq('id', encounterId)
        .single();

      if (error) throw error;

      setEncounter(encounterData);

      // Check DateGuard activation window
      const { data: windowData } = await supabase
        .rpc('can_activate_dateguard', { p_encounter_id: encounterId });

      if (windowData && windowData.length > 0) {
        setWindowStatus(windowData[0] as EncounterWindow);
      }
    } catch (error) {
      console.error('Error loading encounter details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || creatingEncounter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
          <p>{creatingEncounter ? "Creating encounter..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <main className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-6 py-8">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
            <CheckCircle className="w-32 h-32 text-green-400 mx-auto relative" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">✅ V.A.I.-CHECK COMPLETE</h1>
            <p className="text-xl text-white/80">Both Identities Verified</p>
          </div>

          <div className="bg-white/5 rounded-lg p-6 space-y-3 text-left">
            <p className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              Identities verified
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              Contract signed by both
            </p>
            {encounter && (
              <p className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                Encounter created
              </p>
            )}
          </div>

          <p className="text-white/80">
            You can now proceed with your meeting safely
          </p>

          {encounter && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm border border-white/10">
              <p><span className="text-white/60">📋 Encounter ID:</span> {encounter.id.substring(0, 8)}...</p>
              <p><span className="text-white/60">⏰ Created:</span> {new Date(encounter.created_at).toLocaleString()}</p>
              <p><span className="text-white/60">🛡️ DateGuard:</span> {windowStatus?.can_activate ? 'Ready to activate' : 'Window closed'}</p>
              {windowStatus && windowStatus.can_activate && (
                <p className="flex items-center gap-2 text-green-400">
                  <Clock className="w-4 h-4" />
                  <span>Activation window: {windowStatus.days_remaining} days remaining</span>
                </p>
              )}
              {windowStatus && !windowStatus.can_activate && (
                <p className="flex items-center gap-2 text-orange-400">
                  <Lock className="w-4 h-4" />
                  <span>Window closed: {windowStatus.reason}</span>
                </p>
              )}
            </div>
          )}

          {!encounter && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertDescription className="text-white">
                <div className="font-semibold mb-2">Encounter Not Created</div>
                <p className="text-sm text-white/80">
                  There was an issue creating your encounter. Please try again or contact support.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-background/10 rounded-lg p-4 space-y-2 text-sm border border-cyan-400/30">
            <p className="font-semibold text-cyan-400">💡 IMPORTANT:</p>
            <p className="text-white/80">
              DateGuard can be activated until reviews are posted (up to 7 days).
            </p>
            <p className="text-white/80">
              After reviews post, this encounter will be closed and DateGuard can no longer be activated.
            </p>
            <p className="text-white/90 font-medium mt-2">
              Activate now for maximum safety!
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dateguard')}
            disabled={!windowStatus?.can_activate}
            className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {windowStatus && !windowStatus.can_activate ? (
              <>
                <Lock className="w-5 h-5 mr-2" />
                ACTIVATION WINDOW CLOSED
              </>
            ) : (
              <>
                ACTIVATE DATEGUARD
                <span className="text-xs ml-2">(Optional, recommended)</span>
              </>
            )}
          </Button>

          {encounter && (
            <Button
              onClick={() => navigate(`/vai-check/review/${sessionId}`)}
              className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
            >
              LEAVE A REVIEW
            </Button>
          )}

          <button
            onClick={() => navigate('/feed')}
            className="w-full text-white/60 hover:text-white text-sm"
          >
            Continue Without DateGuard
          </button>
        </div>
      </main>
    </div>
  );
}
