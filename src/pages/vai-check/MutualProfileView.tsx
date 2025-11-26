import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function MutualProfileView() {
  const navigate = useNavigate();
  const { sessionId, role } = useParams();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        toast({
          title: "Invalid session",
          description: "Session ID is required",
          variant: "destructive"
        });
        navigate("/vai-check");
        return;
      }

      // Verify authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      // Load session from database
      const { data: sessionData, error: sessionError } = await supabase
        .from('vai_check_sessions')
        .select('*, provider_id, client_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({
          title: "Session not found",
          description: "This session may have expired",
          variant: "destructive"
        });
        navigate("/vai-check");
        return;
      }

      setSession(sessionData);

      // Determine the other user's ID
      const otherUserId = role === 'provider' ? sessionData.client_id : sessionData.provider_id;
      
      if (!otherUserId) {
        toast({
          title: "Waiting for other user",
          description: "The other participant hasn't joined yet",
        });
        setWaiting(true);
        return;
      }

      // Load other user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, provider_profiles(*)')
        .eq('id', otherUserId)
        .single();

      if (profileError || !profile) {
        toast({
          title: "Profile not found",
          variant: "destructive"
        });
        return;
      }

      // Load V.A.I. number
      const { data: vaiVerification } = await supabase
        .from('vai_verifications')
        .select('vai_number')
        .eq('user_id', otherUserId)
        .single();

      // Load reviews count and rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', otherUserId);

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      setOtherUser({
        name: profile.provider_profiles?.username || profile.full_name || 'Unknown',
        vaiNumber: vaiVerification?.vai_number || 'N/A',
        rating: avgRating,
        reviews: reviews?.length || 0,
        location: profile.location || 'Location not set',
        memberSince: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bio: profile.bio || 'No bio available',
        verified: !!vaiVerification
      });
    };

    loadSessionData();
  }, [sessionId, role, navigate, toast]);

  const handleDecision = async (decision: 'accept' | 'decline') => {
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    // Update session with decision
    const updateField = role === 'provider' ? 'provider_decision' : 'client_decision';
    const { error } = await supabase
      .from('vai_check_sessions')
      .update({
        [updateField]: decision === 'accept' ? 'accept' : 'decline',
        status: decision === 'accept' ? 'profiles_viewed' : 'declined'
      })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save decision",
        variant: "destructive"
      });
      return;
    }

    if (decision === 'decline') {
      navigate(`/vai-check/declined/${sessionId}`);
    } else {
      // Wait for other user's decision
      setWaiting(true);
      
      // Poll for other user's decision
      const checkOtherDecision = async () => {
        const { data: sessionData } = await supabase
          .from('vai_check_sessions')
          .select('provider_decision, client_decision')
          .eq('id', sessionId)
          .single();

        if (sessionData) {
          const otherDecision = role === 'provider' 
            ? sessionData.client_decision 
            : sessionData.provider_decision;

          if (otherDecision === 'accept') {
            navigate(`/vai-check/contract/${sessionId}/${role}`);
          } else if (otherDecision === 'decline') {
            navigate(`/vai-check/declined/${sessionId}`);
          }
        }
      };

      // Check every 2 seconds for up to 60 seconds
      const interval = setInterval(checkOtherDecision, 2000);
      setTimeout(() => clearInterval(interval), 60000);
    }
  };

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] flex items-center justify-center">
        <div className="text-center text-white space-y-4 p-4">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold">You accepted</h2>
          <div className="animate-pulse">⏳</div>
          <p>Waiting for {otherUser.name} to decide...</p>
          <p className="text-sm text-white/60">They're reviewing your profile and reviews right now</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#1E40AF] text-white pb-24">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-gradient-to-b from-[#0A1628] to-transparent z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDecision('decline')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm">V.A.I.-CHECK</span>
        <div className="w-10"></div>
      </header>

      <main className="px-4 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm text-white/60 mb-4">YOU'RE VIEWING:</p>
          
          <div className="w-32 h-32 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
            <span className="text-5xl">👤</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {otherUser.name} {otherUser.verified && '✅'}
          </h1>
          <p className="text-sm text-white/60">V.A.I. #: {otherUser.vaiNumber}</p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>{otherUser.rating} ({otherUser.reviews} reviews)</span>
          </div>

          <p className="text-sm text-white/60 mt-2">
            📍 {otherUser.location} • ✅ Member since {otherUser.memberSince}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">ABOUT</h3>
            <p className="text-white/80 text-sm">{otherUser.bio}</p>
          </div>

          <div>
            <h3 className="font-bold mb-3">📊 TRUEREVU REVIEWS ({otherUser.reviews})</h3>
            
            <div className="space-y-3">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm ml-2">5.0</span>
                    </div>
                    <span className="text-xs text-white/60">3 days ago</span>
                  </div>
                  <p className="text-sm font-semibold">Jordan K. ✅</p>
                  <p className="text-sm text-white/80">"Great experience! Very respectful and professional"</p>
                  <div className="flex flex-wrap gap-2 text-xs text-green-400">
                    <span>✓ V.A.I.-CHECK completed</span>
                    <span>✓ DateGuard active</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm ml-2">5.0</span>
                    </div>
                    <span className="text-xs text-white/60">1 week ago</span>
                  </div>
                  <p className="text-sm font-semibold">Taylor P. ✅</p>
                  <p className="text-sm text-white/80">"Excellent! Highly recommend..."</p>
                  <div className="flex flex-wrap gap-2 text-xs text-green-400">
                    <span>✓ V.A.I.-CHECK completed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <p className="font-bold mb-2">⚠️ MAKE YOUR DECISION</p>
            <p className="text-sm text-white/80">
              Review their profile & reviews carefully. The other person is reviewing yours right now.
            </p>
          </div>

          <Button
            onClick={() => handleDecision('accept')}
            className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
          >
            ACCEPT MEETING
          </Button>

          <button
            onClick={() => handleDecision('decline')}
            className="w-full text-red-400 hover:text-red-300 text-sm"
          >
            Decline
          </button>
        </div>
      </main>
    </div>
  );
}
