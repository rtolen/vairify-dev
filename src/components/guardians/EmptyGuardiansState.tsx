import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyGuardiansStateProps {
  onInvite: () => void;
}

export default function EmptyGuardiansState({ onInvite }: EmptyGuardiansStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative w-24 h-24 bg-white/5 border-2 border-dashed border-white/30 rounded-full flex items-center justify-center">
          <Shield className="w-12 h-12 text-white/50" />
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-xl p-8 max-w-md space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">No Guardians Added Yet</h3>
          <p className="text-sm text-white/70 mb-6">
            Add guardians who will monitor your safety during appointments.
          </p>
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <p className="font-medium">They'll receive:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Your exact location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Photo documentation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Nearest police info</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Emergency alerts</span>
            </li>
          </ul>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-xs text-white/90">
            💡 We recommend at least 3 guardians for maximum protection
          </p>
        </div>
      </div>

      <Button
        onClick={onInvite}
        className="mt-8 w-full max-w-md h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-cyan-500/50"
      >
        + Invite Your First Guardian
      </Button>
    </div>
  );
}
