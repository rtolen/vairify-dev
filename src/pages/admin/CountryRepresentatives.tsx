import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addYears } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trophy, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

export default function CountryRepresentatives() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["country-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_representative_competitions")
        .select("*")
        .order("competition_end_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createCompetition = useMutation({
    mutationFn: async () => {
      if (!selectedCountry || !endDate) {
        throw new Error("Please select a country and end date");
      }

      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (!country) throw new Error("Invalid country");

      const { error } = await supabase
        .from("country_representative_competitions")
        .insert({
          country_code: selectedCountry,
          country_name: country.name,
          competition_start_date: new Date().toISOString(),
          competition_end_date: new Date(endDate).toISOString(),
          status: "active",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["country-competitions"] });
      setIsCreating(false);
      setSelectedCountry("");
      setEndDate("");
      toast({
        title: "Competition created",
        description: "Country representative competition has been started.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endCompetition = useMutation({
    mutationFn: async (competitionId: string) => {
      const { error } = await supabase
        .from("country_representative_competitions")
        .update({
          status: "ended",
          competition_end_date: new Date().toISOString(),
        })
        .eq("id", competitionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["country-competitions"] });
      toast({
        title: "Competition ended",
        description: "The competition has been marked as ended.",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Country Representatives</h1>
              </div>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Competition
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Country Competition</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-date">Competition End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Typically set for 1 year from today
                    </p>
                  </div>
                  <Button
                    onClick={() => createCompetition.mutate()}
                    disabled={!selectedCountry || !endDate || createCompetition.isPending}
                    className="w-full"
                  >
                    Start Competition
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {competitions?.map((competition) => (
            <Card key={competition.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{competition.country_name}</h3>
                    <Badge
                      variant={competition.status === "active" ? "default" : "secondary"}
                    >
                      {competition.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Started: {format(new Date(competition.competition_start_date), "MMM d, yyyy")}</p>
                    <p>Ends: {format(new Date(competition.competition_end_date), "MMM d, yyyy")}</p>
                    {competition.winner_announced_at && (
                      <p>Winner announced: {format(new Date(competition.winner_announced_at), "MMM d, yyyy")}</p>
                    )}
                  </div>
                </div>
                {competition.status === "active" && (
                  <Button
                    variant="outline"
                    onClick={() => endCompetition.mutate(competition.id)}
                    disabled={endCompetition.isPending}
                  >
                    End Competition
                  </Button>
                )}
              </div>

              {competition.winner_user_id && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    Winner: User ID {competition.winner_user_id}
                  </p>
                </div>
              )}
            </Card>
          ))}

          {competitions?.length === 0 && !isLoading && (
            <Card className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Competitions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a country representative competition to begin tracking referrals.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
