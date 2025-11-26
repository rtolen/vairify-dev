import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PendingMeetings } from "@/components/vairidate/PendingMeetings";

export default function VAICheckIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/feed")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vai-check/help")}
          className="text-white hover:bg-white/10"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </header>

      <main className="px-4 py-8 max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">📷 V.A.I.-CHECK</h1>
        </div>

        {/* Pending Meetings Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white/90">Pending Meetings</h3>
          <PendingMeetings />
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-cyan-400/50">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Verify Identity Before Meeting</h2>
        </div>

        <Card className="bg-white/5 border-cyan-400/30">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">How it works:</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">1️⃣</span>
                <span>You scan your face</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">2️⃣</span>
                <span>Show QR code to other person</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">3️⃣</span>
                <span>They scan your QR code</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">4️⃣</span>
                <span>You BOTH see each other's profiles & reviews</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">5️⃣</span>
                <span>You BOTH decide: Accept or Decline</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">6️⃣</span>
                <span>Sign contract together</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold">7️⃣</span>
                <span>Final face verification</span>
              </div>
            </div>

            <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Takes 2-3 minutes
              </p>
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Prevents all catfishing
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => navigate("/vai-check/face-scan")}
          className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-cyan-500/50"
        >
          START V.A.I.-CHECK
        </Button>

        <div className="text-center">
          <button 
            onClick={() => navigate("/vai-check/scan-qr")}
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            I'm the Client - Scan QR Code
          </button>
        </div>
      </main>
    </div>
  );
}
