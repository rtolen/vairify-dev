import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, MessageSquare, Link as LinkIcon, Plus, X, Save, User, History, Shield } from "lucide-react";
import { format } from "date-fns";
import { VAIStatusBadge } from "@/components/vai/VAIStatusBadge";
import { useVAIStatus } from "@/hooks/useVAIStatus";

interface ProfileLink {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface Appointment {
  id: string;
  appointment_type: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  provider_id: string;
  notes: string;
  provider?: {
    full_name: string;
    avatar_url: string;
  };
}

const ClientProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  
  // Profile data
  const [bio, setBio] = useState("");
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  
  // Appointments
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  
  // V.A.I. Status
  const vaiStatus = useVAIStatus();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      
      setUserId(user.id);
      await Promise.all([
        loadProfile(user.id),
        loadAppointments(user.id)
      ]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (uid: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (profile) {
      setBio((profile as any).bio || "");
      setProfileLinks((profile as any).profile_links || []);
    }
  };

  const loadAppointments = async (uid: string) => {
    const now = new Date().toISOString();
    
    // Pending appointments
    const { data: pending } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", uid)
      .gte("start_time", now)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true });

    // Past appointments
    const { data: past } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_id", uid)
      .lt("start_time", now)
      .order("start_time", { ascending: false })
      .limit(10);

    // Fetch provider profiles separately
    if (pending && pending.length > 0) {
      const providerIds = [...new Set(pending.map(apt => apt.provider_id))];
      const { data: providerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", providerIds);
      
      const pendingWithProviders = pending.map(apt => ({
        ...apt,
        provider: providerProfiles?.find(p => p.id === apt.provider_id)
      }));
      setPendingAppointments(pendingWithProviders as any);
    } else {
      setPendingAppointments([]);
    }

    if (past && past.length > 0) {
      const providerIds = [...new Set(past.map(apt => apt.provider_id))];
      const { data: providerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", providerIds);
      
      const pastWithProviders = past.map(apt => ({
        ...apt,
        provider: providerProfiles?.find(p => p.id === apt.provider_id)
      }));
      setPastAppointments(pastWithProviders as any);
    } else {
      setPastAppointments([]);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio,
          profile_links: profileLinks as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      toast.error("Please enter both title and URL");
      return;
    }

    const newLink: ProfileLink = {
      id: crypto.randomUUID(),
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      order: profileLinks.length
    };

    setProfileLinks([...profileLinks, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
  };

  const removeLink = (id: string) => {
    setProfileLinks(profileLinks.filter(link => link.id !== id));
  };

  const startConversation = async (providerId: string) => {
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1_id.eq.${userId},participant_2_id.eq.${providerId}),and(participant_1_id.eq.${providerId},participant_2_id.eq.${userId})`)
        .single();

      if (existing) {
        navigate(`/chat?conversation=${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          participant_1_id: userId,
          participant_2_id: providerId
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/chat?conversation=${newConversation.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const AppointmentCard = ({ apt, isPast = false }: { apt: Appointment; isPast?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={apt.provider?.avatar_url} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{apt.provider?.full_name || "Provider"}</p>
                <p className="text-sm text-muted-foreground">{apt.appointment_type}</p>
              </div>
              <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                {apt.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(apt.start_time), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(apt.start_time), "h:mm a")} - {format(new Date(apt.end_time), "h:mm a")}
                </span>
              </div>
              {apt.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{apt.location}</span>
                </div>
              )}
            </div>
            
            {apt.notes && (
              <p className="text-sm text-muted-foreground italic">{apt.notes}</p>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => startConversation(apt.provider_id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Provider
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <div className="mt-2">
              <VAIStatusBadge 
                isVerified={vaiStatus.isVerified} 
                vaiNumber={vaiStatus.vaiNumber}
                size="sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {vaiStatus.isVerified && (
              <Button variant="outline" size="sm" onClick={() => navigate("/vai-management")}>
                <Shield className="w-4 h-4 mr-2" />
                Manage V.A.I.
              </Button>
            )}
            <Button onClick={() => navigate("/settings")}>Settings</Button>
          </div>
        </div>

        <Tabs defaultValue="customize" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Customization</CardTitle>
                <CardDescription>Create your personalized profile page like Linktree</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    placeholder="Tell others about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Profile Links</label>
                  
                  {profileLinks.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{link.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(link.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Card className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <Input
                        placeholder="Link title (e.g., Instagram)"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                      />
                      <Input
                        placeholder="URL (e.g., https://instagram.com/...)"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                      />
                      <Button onClick={addLink} className="w-full" variant="secondary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  {pendingAppointments.length} pending appointment{pendingAppointments.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming appointments</p>
                  </div>
                ) : (
                  pendingAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} apt={apt} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>Your past appointments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pastAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No appointment history</p>
                  </div>
                ) : (
                  pastAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} apt={apt} isPast />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientProfile;
