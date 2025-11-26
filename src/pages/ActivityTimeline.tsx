import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, CheckCircle, Shield, Star, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isAfter } from "date-fns";

type ActivityType = 'all' | 'encounters' | 'reviews' | 'dateguard';
type DateRange = '7' | '30' | '90' | 'all';

interface Activity {
  id: string;
  type: 'encounter' | 'review' | 'dateguard';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  icon: React.ReactNode;
}

export default function ActivityTimeline() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30');

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, activityType, dateRange]);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allActivities: Activity[] = [];

      // Fetch encounters
      const { data: encounters } = await supabase
        .from('encounters')
        .select('*')
        .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (encounters) {
        encounters.forEach(encounter => {
          allActivities.push({
            id: encounter.id,
            type: 'encounter',
            title: 'V.A.I.-CHECK Encounter',
            description: `Status: ${encounter.status}`,
            timestamp: new Date(encounter.accepted_at || encounter.created_at),
            status: encounter.status,
            icon: <CheckCircle className="w-5 h-5 text-green-400" />
          });

          if (encounter.completed_at) {
            allActivities.push({
              id: `${encounter.id}-completed`,
              type: 'encounter',
              title: 'Encounter Completed',
              description: 'Meeting successfully completed',
              timestamp: new Date(encounter.completed_at),
              status: 'completed',
              icon: <CheckCircle className="w-5 h-5 text-cyan-400" />
            });
          }
        });
      }

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (reviews) {
        reviews.forEach(review => {
          if (review.submitted) {
            allActivities.push({
              id: review.id,
              type: 'review',
              title: 'Review Submitted',
              description: `Overall rating: ${review.overall_rating || 'N/A'} stars`,
              timestamp: new Date(review.submitted_at || review.created_at),
              status: review.published ? 'published' : 'pending',
              icon: <Star className="w-5 h-5 text-yellow-400" />
            });
          }

          if (review.published) {
            allActivities.push({
              id: `${review.id}-published`,
              type: 'review',
              title: 'Review Published',
              description: 'Your review is now visible',
              timestamp: new Date(review.published_at!),
              status: 'published',
              icon: <Star className="w-5 h-5 text-orange-400" />
            });
          }
        });
      }

      // Fetch DateGuard sessions
      const { data: sessions } = await supabase
        .from('dateguard_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessions) {
        sessions.forEach(session => {
          allActivities.push({
            id: session.id,
            type: 'dateguard',
            title: 'DateGuard Activated',
            description: `${session.duration_minutes} min session at ${session.location_name}`,
            timestamp: new Date(session.started_at),
            status: session.status,
            icon: <Shield className="w-5 h-5 text-purple-400" />
          });

          if (session.status === 'completed') {
            allActivities.push({
              id: `${session.id}-completed`,
              type: 'dateguard',
              title: 'DateGuard Session Ended',
              description: 'Session completed safely',
              timestamp: new Date(session.ends_at),
              status: 'completed',
              icon: <Shield className="w-5 h-5 text-green-400" />
            });
          }

          if (session.status === 'emergency') {
            allActivities.push({
              id: `${session.id}-emergency`,
              type: 'dateguard',
              title: 'Emergency Alert Triggered',
              description: 'Emergency response initiated',
              timestamp: new Date(session.updated_at),
              status: 'emergency',
              icon: <Shield className="w-5 h-5 text-red-400" />
            });
          }
        });
      }

      // Sort all activities by timestamp
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by type
    if (activityType !== 'all') {
      filtered = filtered.filter(a => a.type === activityType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter(a => isAfter(a.timestamp, cutoffDate));
    }

    setFilteredActivities(filtered);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'active':
      case 'in_progress':
        return 'text-cyan-400';
      case 'emergency':
        return 'text-red-400';
      case 'published':
        return 'text-orange-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-foreground/60';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Activity Timeline</h1>
            <p className="text-sm text-muted-foreground">Your recent activity history</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Type</label>
              <Tabs value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="encounters">Encounters</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="dateguard">DateGuard</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No activities found</h3>
              <p className="text-muted-foreground">
                {activityType !== 'all' || dateRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your activity will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
              </h2>
            </div>

            <div className="relative border-l-2 border-border ml-3 space-y-6">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative pl-8 pb-6">
                  <div className="absolute -left-3 top-0 bg-card border-2 border-border rounded-full p-1">
                    {activity.icon}
                  </div>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          {activity.status && (
                            <span className={`text-xs font-medium mt-2 inline-block ${getStatusColor(activity.status)}`}>
                              {activity.status.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <div>{format(activity.timestamp, 'MMM d, yyyy')}</div>
                          <div>{format(activity.timestamp, 'h:mm a')}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
