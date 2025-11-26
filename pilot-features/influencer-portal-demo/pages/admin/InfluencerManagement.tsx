import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, DollarSign, Code, Filter, Plus, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function InfluencerManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [applications, setApplications] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAccessCodeDialog, setShowAccessCodeDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [approvalData, setApprovalData] = useState({ commissionRate: 0.10, notes: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [newAccessCode, setNewAccessCode] = useState({ name: "", expiresDays: 30 });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [appsData, infData, codesData, payoutsData] = await Promise.all([
        supabase.from('influencer_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('influencers').select('*').order('created_at', { ascending: false }),
        supabase.from('influencer_access_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('influencer_payouts').select('*').order('requested_at', { ascending: false })
      ]);

      setApplications(appsData.data || []);
      setInfluencers(infData.data || []);
      setAccessCodes(codesData.data || []);
      setPayouts(payoutsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update application
      await supabase
        .from('influencer_applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      // Create influencer account
      // TODO: Send approval email with login link
      
      toast.success("Application approved!");
      setShowApproveDialog(false);
      setSelectedApplication(null);
      loadData();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error.message || "Failed to approve application");
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('influencer_applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedApplication.id);

      // TODO: Send rejection email
      
      toast.success("Application rejected");
      setShowRejectDialog(false);
      setSelectedApplication(null);
      setRejectionReason("");
      loadData();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error(error.message || "Failed to reject application");
    }
  };

  const generateAccessCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = `ADVOCATE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (newAccessCode.expiresDays || 30));

      const { error } = await supabase
        .from('influencer_access_codes')
        .insert({
          code,
          influencer_name: newAccessCode.name,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast.success(`Access code generated: ${code}`);
      setShowAccessCodeDialog(false);
      setNewAccessCode({ name: "", expiresDays: 30 });
      loadData();
    } catch (error: any) {
      console.error('Error generating access code:', error);
      toast.error(error.message || "Failed to generate access code");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-warning/10 text-warning">Suspended</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingApplications = applications.filter(a => a.status === 'pending');
  const activeInfluencers = influencers.filter(i => i.status === 'approved');
  const pendingPayouts = payouts.filter(p => p.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Influencer Management
            </h1>
            <p className="text-sm text-muted-foreground">Manage influencer applications, accounts, and payouts</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Applications</p>
                  <p className="text-2xl font-bold">{pendingApplications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Influencers</p>
                  <p className="text-2xl font-bold">{activeInfluencers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold">{pendingPayouts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Code className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Access Codes</p>
                  <p className="text-2xl font-bold">{accessCodes.filter(c => c.is_active && !c.used_by).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <Tabs defaultValue="applications">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="applications">Applications ({pendingApplications.length})</TabsTrigger>
              <TabsTrigger value="influencers">Active Influencers ({activeInfluencers.length})</TabsTrigger>
              <TabsTrigger value="access-codes">Access Codes</TabsTrigger>
              <TabsTrigger value="payouts">Payouts ({pendingPayouts.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Pending Applications */}
            <TabsContent value="applications" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Pending Applications</h3>
              </div>
              {pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending applications
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{app.username}</h4>
                              <Badge variant="outline">{app.niche}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{app.email}</p>
                            <p className="text-sm">Audience: {app.audience_size}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{app.why_partner}</p>
                            <p className="text-xs text-muted-foreground">
                              Applied: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowApproveDialog(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowRejectDialog(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Active Influencers */}
            <TabsContent value="influencers" className="space-y-4 mt-4">
              <div className="space-y-4">
                {activeInfluencers.map((inf) => (
                  <Card key={inf.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{inf.username}</h4>
                            {getStatusBadge(inf.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{inf.email}</p>
                          <p className="text-sm">
                            Commission: {(inf.commission_rate * 100).toFixed(0)}% | 
                            Earnings: ${inf.total_earnings?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Access Codes */}
            <TabsContent value="access-codes" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Access Code Generator</h3>
                <Button onClick={() => setShowAccessCodeDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
              </div>
              <div className="space-y-2">
                {accessCodes.map((code) => (
                  <Card key={code.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <code className="font-mono font-bold">{code.code}</code>
                          <p className="text-xs text-muted-foreground">
                            {code.influencer_name || 'Unnamed'} • 
                            {code.used_by ? ' Used' : ' Available'} • 
                            Created: {new Date(code.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={code.used_by ? "outline" : "default"}>
                          {code.used_by ? "Used" : "Active"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Payouts */}
            <TabsContent value="payouts" className="space-y-4 mt-4">
              <div className="space-y-4">
                {pendingPayouts.map((payout) => (
                  <Card key={payout.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">${payout.amount}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested: {new Date(payout.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Approve</Button>
                          <Button variant="destructive" size="sm">Reject</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Set commission rate and approve this influencer application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="5"
                max="25"
                step="0.1"
                value={approvalData.commissionRate * 100}
                onChange={(e) => setApprovalData({ ...approvalData, commissionRate: parseFloat(e.target.value) / 100 })}
              />
              <p className="text-xs text-muted-foreground">5% - 25% (default: 10%)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection (required)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                required
                placeholder="Explain why this application was rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Code Dialog */}
      <Dialog open={showAccessCodeDialog} onOpenChange={setShowAccessCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Access Code</DialogTitle>
            <DialogDescription>
              Create an access code for a recruited advocate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="influencerName">Influencer Name/Identifier</Label>
              <Input
                id="influencerName"
                value={newAccessCode.name}
                onChange={(e) => setNewAccessCode({ ...newAccessCode, name: e.target.value })}
                placeholder="e.g., TimmyDoesDallas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresDays">Expires In (Days)</Label>
              <Input
                id="expiresDays"
                type="number"
                min="1"
                value={newAccessCode.expiresDays}
                onChange={(e) => setNewAccessCode({ ...newAccessCode, expiresDays: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccessCodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generateAccessCode}>
              Generate Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


