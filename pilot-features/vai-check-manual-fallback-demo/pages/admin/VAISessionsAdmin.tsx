import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Filter, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function VAISessionsAdmin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationMethodFilter, setVerificationMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadSessions();
    }
  }, [isAdmin, verificationMethodFilter]);

  const loadSessions = async () => {
    try {
      let query = supabase
        .from('vai_check_sessions')
        .select(`
          *,
          provider:provider_id(id, email, full_name),
          client:client_id(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (verificationMethodFilter !== "all") {
        query = query.eq('verification_method', verificationMethodFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const getVerificationMethodBadge = (method: string | null) => {
    if (method === 'manual_fallback') {
      return <Badge variant="outline" className="bg-warning/10 text-warning-foreground">Manual Fallback</Badge>;
    }
    return <Badge variant="outline" className="bg-success/10 text-success-foreground">Automated</Badge>;
  };

  const getReviewReasonBadge = (reason: string | null) => {
    if (!reason) return null;
    
    const labels: Record<string, string> = {
      system_failure: "System Failure",
      individual_issue: "Individual Issue",
      failed_verification: "Failed Verification"
    };

    return (
      <Badge variant="outline" className="text-xs">
        {labels[reason] || reason}
      </Badge>
    );
  };

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;
    
    if (decision === 'approved') {
      return <Badge variant="outline" className="bg-success/10 text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    }
    if (decision === 'rejected') {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="outline" className="bg-muted"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.session_code?.toLowerCase().includes(query) ||
      session.manual_reviewer_vai_number?.toLowerCase().includes(query) ||
      (session.provider as any)?.email?.toLowerCase().includes(query) ||
      (session.client as any)?.email?.toLowerCase().includes(query)
    );
  });

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                V.A.I. Check Sessions
              </h1>
              <p className="text-sm text-muted-foreground">Monitor all verification sessions</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter sessions by verification method and search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by session code, VAI number, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={verificationMethodFilter} onValueChange={setVerificationMethodFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Verification Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="automated">Automated</SelectItem>
                  <SelectItem value="manual_fallback">Manual Fallback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sessions ({filteredSessions.length})</CardTitle>
            <CardDescription>View and monitor all VAI check verification sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-semibold">Session Code</th>
                    <th className="text-left p-2 text-sm font-semibold">Verification Method</th>
                    <th className="text-left p-2 text-sm font-semibold">Manual Review Reason</th>
                    <th className="text-left p-2 text-sm font-semibold">Reviewer VAI</th>
                    <th className="text-left p-2 text-sm font-semibold">Decision</th>
                    <th className="text-left p-2 text-sm font-semibold">Consent Timestamps</th>
                    <th className="text-left p-2 text-sm font-semibold">Status</th>
                    <th className="text-left p-2 text-sm font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm font-mono">{session.session_code}</td>
                      <td className="p-2">
                        {getVerificationMethodBadge(session.verification_method)}
                      </td>
                      <td className="p-2">
                        {getReviewReasonBadge(session.manual_review_reason)}
                      </td>
                      <td className="p-2 text-sm font-mono">
                        {session.manual_reviewer_vai_number || '-'}
                      </td>
                      <td className="p-2">
                        {getDecisionBadge(session.manual_review_decision)}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        <div>Owner: {session.owner_consent_timestamp ? new Date(session.owner_consent_timestamp).toLocaleString() : '-'}</div>
                        <div>Reviewer: {session.reviewer_consent_timestamp ? new Date(session.reviewer_consent_timestamp).toLocaleString() : '-'}</div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{session.status}</Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sessions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


