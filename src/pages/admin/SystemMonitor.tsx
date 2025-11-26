import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, Database, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ErrorLog {
  id: string;
  timestamp: number;
  severity: string;
  message: string;
  source: string;
}

interface NetworkMetric {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

interface DatabaseMetric {
  query_type: string;
  table_name: string;
  duration: number;
  timestamp: number;
}

export default function SystemMonitor() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([]);
  const [dbMetrics, setDatabaseMetrics] = useState<DatabaseMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSystemData = async () => {
    try {
      setIsLoading(true);

      // Fetch recent emergency events as error logs
      const { data: emergencyEvents } = await supabase
        .from('emergency_events')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(20);

      const { data: dateguardSessions } = await supabase
        .from('dateguard_sessions')
        .select('*')
        .eq('status', 'emergency')
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedErrors: ErrorLog[] = [
        ...(emergencyEvents || []).map((event) => ({
          id: event.id,
          timestamp: new Date(event.triggered_at).getTime(),
          severity: 'ERROR',
          message: `Emergency triggered: ${event.trigger_type} - ${event.location_address || 'Unknown location'}`,
          source: 'Emergency System'
        })),
        ...(dateguardSessions || []).map((session) => ({
          id: session.id,
          timestamp: new Date(session.created_at).getTime(),
          severity: 'WARNING',
          message: `Emergency DateGuard session at ${session.location_name}`,
          source: 'DateGuard'
        }))
      ].sort((a, b) => b.timestamp - a.timestamp);

      setErrorLogs(formattedErrors);

      // Simulate network metrics (in production, this would come from actual monitoring)
      const mockNetworkMetrics: NetworkMetric[] = [
        { endpoint: '/api/users', method: 'GET', status: 200, duration: 45, timestamp: Date.now() },
        { endpoint: '/api/profiles', method: 'POST', status: 201, duration: 120, timestamp: Date.now() - 5000 },
        { endpoint: '/api/vai-verification', method: 'POST', status: 200, duration: 340, timestamp: Date.now() - 10000 },
        { endpoint: '/api/emergency-alert', method: 'POST', status: 200, duration: 78, timestamp: Date.now() - 15000 },
      ];
      setNetworkMetrics(mockNetworkMetrics);

      // Simulate database metrics
      const mockDbMetrics: DatabaseMetric[] = [
        { query_type: 'SELECT', table_name: 'vai_verifications', duration: 12, timestamp: Date.now() },
        { query_type: 'INSERT', table_name: 'emergency_events', duration: 8, timestamp: Date.now() - 3000 },
        { query_type: 'UPDATE', table_name: 'dateguard_sessions', duration: 15, timestamp: Date.now() - 7000 },
        { query_type: 'SELECT', table_name: 'provider_profiles', duration: 23, timestamp: Date.now() - 12000 },
      ];
      setDatabaseMetrics(mockDbMetrics);

    } catch (error) {
      console.error('Error fetching system data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch system monitoring data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(fetchSystemData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'ERROR':
      case 'FATAL':
        return 'destructive';
      case 'WARNING':
      case 'WARN':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 400 && status < 500) return 'secondary';
    if (status >= 500) return 'destructive';
    return 'outline';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Monitor</h1>
          <p className="text-muted-foreground">Real-time tracking of errors, network, and database activity</p>
        </div>
        <Button onClick={fetchSystemData} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorLogs.filter(e => e.severity === 'ERROR').length}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Requests</CardTitle>
            <Network className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkMetrics.length}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Queries</CardTitle>
            <Database className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbMetrics.length}</div>
            <p className="text-xs text-muted-foreground">Last 10 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkMetrics.length > 0 
                ? Math.round(networkMetrics.reduce((a, b) => a + b.duration, 0) / networkMetrics.length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Network latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Error Logs
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="mr-2 h-4 w-4" />
            Network Activity
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>System errors and warnings from all sources</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <div className="space-y-2">
                  {errorLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No errors logged</p>
                  ) : (
                    errorLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between border-b pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            <Badge variant="outline">{log.source}</Badge>
                          </div>
                          <p className="text-sm font-mono">{log.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Request Monitor</CardTitle>
              <CardDescription>Recent API calls and response times</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <div className="space-y-2">
                  {networkMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{metric.method}</Badge>
                          <span className="font-mono text-sm">{metric.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(metric.status)}>{metric.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {metric.duration}ms • {formatTimestamp(metric.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Query Monitor</CardTitle>
              <CardDescription>Recent database operations and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <div className="space-y-2">
                  {dbMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{metric.query_type}</Badge>
                          <span className="font-mono text-sm">{metric.table_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {metric.duration}ms • {formatTimestamp(metric.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
