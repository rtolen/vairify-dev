import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EdgeLog {
  id: string;
  timestamp: number;
  event_message: string;
  metadata?: {
    level?: string;
    action?: string;
    user_id?: string;
    email?: string;
    status?: string;
    error_message?: string;
    duration_ms?: number;
  };
}

export default function EmailLogs() {
  const [logs, setLogs] = useState<EdgeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-application-status", {
        method: "GET"
      }).catch(() => ({ data: null, error: null }));

      // Since we can't directly query edge function logs from the frontend,
      // we'll show a message to use the Lovable Cloud logs viewer
      toast.info("View detailed logs in Lovable Cloud dashboard");
      
      // For now, show placeholder data structure
      setLogs([]);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case "SUCCESS":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "ERROR":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "INFO":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || 
      log.metadata?.level?.toLowerCase() === levelFilter.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Email Notification Logs</h1>
              <p className="text-muted-foreground mt-1">
                Track email sending attempts, successes, and failures
              </p>
            </div>
            <Button onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              View Logs in Lovable Cloud
            </CardTitle>
            <CardDescription>
              To view detailed edge function logs with timestamps and structured data:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Navigate to <strong>Desktop</strong>: Click the Cloud icon in the top navigation bar</li>
              <li>Navigate to <strong>Mobile</strong>: Tap the Widgets icon in bottom-right (Chat mode)</li>
              <li>Select <strong>Edge Functions</strong> from the Cloud menu</li>
              <li>Click on <strong>notify-application-status</strong> function</li>
              <li>View logs with filtering by search term</li>
            </ol>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Log Structure:</p>
              <ul className="text-xs space-y-1 text-muted-foreground font-mono">
                <li>• <strong>SUCCESS</strong>: Email sent successfully with duration</li>
                <li>• <strong>ERROR</strong>: Failed operations with error details</li>
                <li>• <strong>INFO</strong>: Process steps and user notifications skipped</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No logs to display. Use the Lovable Cloud dashboard to view real-time edge function logs.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getLevelColor(log.metadata?.level)}>
                          {log.metadata?.level || "UNKNOWN"}
                        </Badge>
                        <Badge variant="outline">{log.metadata?.action || "N/A"}</Badge>
                        {log.metadata?.duration_ms && (
                          <Badge variant="secondary">
                            {formatDuration(log.metadata.duration_ms)}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm">{log.event_message}</p>
                      
                      {log.metadata && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {log.metadata.user_id && (
                            <div>User ID: {log.metadata.user_id}</div>
                          )}
                          {log.metadata.email && (
                            <div>Email: {log.metadata.email}</div>
                          )}
                          {log.metadata.status && (
                            <div>Status: {log.metadata.status}</div>
                          )}
                          {log.metadata.error_message && (
                            <div className="text-red-500 font-mono mt-2 p-2 bg-red-500/5 rounded">
                              Error: {log.metadata.error_message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
