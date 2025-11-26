import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Users, TrendingUp, Mail, MessageSquare, Filter, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function ReferralManagementUpdated() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [stats, setStats] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("all");
  const [referrerTypeFilter, setReferrerTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, deliveryStatusFilter, referrerTypeFilter]);

  const loadData = async () => {
    try {
      const [referralsData, invitationsData, earningsData, payoutsData] = await Promise.all([
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_invitations').select('*').order('invited_at', { ascending: false }),
        supabase.from('referral_earnings').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_payouts').select('*').order('payout_date', { ascending: false })
      ]);

      setReferrals(referralsData.data || []);
      setInvitations(invitationsData.data || []);
      setEarnings(earningsData.data || []);
      setPayouts(payoutsData.data || []);

      // Calculate stats
      const totalReferrals = referralsData.data?.length || 0;
      const premiumReferrals = referralsData.data?.filter(r => r.subscription_status === 'premium').length || 0;
      const totalEarnings = earningsData.data?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const totalPayouts = payoutsData.data?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const sentInvitations = invitationsData.data?.filter(i => i.delivery_status === 'sent').length || 0;
      const failedInvitations = invitationsData.data?.filter(i => i.delivery_status === 'failed').length || 0;

      setStats({
        totalReferrals,
        premiumReferrals,
        totalEarnings,
        totalPayouts,
        totalInvitations: invitationsData.data?.length || 0,
        sentInvitations,
        failedInvitations
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const { data: invitation } = await supabase
        .from('referral_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (!invitation) {
        toast.error("Invitation not found");
        return;
      }

      // Reset delivery status
      await supabase
        .from('referral_invitations')
        .update({
          delivery_status: 'pending',
          sent_at: null,
          delivery_error: null
        })
        .eq('id', invitationId);

      // Resend based on method
      if (invitation.invite_method === 'email') {
        const { error } = await supabase.functions.invoke('send-referral-email', {
          body: {
            invitation_id: invitationId,
            to_email: invitation.invite_target,
            referral_code: invitation.custom_code ? null : undefined,
            custom_code: invitation.custom_code || undefined,
            message: invitation.message || null
          }
        });
        if (error) throw error;
      } else if (invitation.invite_method === 'sms') {
        const { error } = await supabase.functions.invoke('send-referral-sms', {
          body: {
            invitation_id: invitationId,
            to_phone: invitation.invite_target,
            referral_code: invitation.custom_code ? null : undefined,
            custom_code: invitation.custom_code || undefined,
            message: invitation.message || null
          }
        });
        if (error) throw error;
      }

      toast.success("Invitation resent successfully");
      loadData();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'bounced':
        return <Badge variant="outline" className="bg-warning/10 text-warning">Bounced</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (deliveryStatusFilter !== "all" && invitation.delivery_status !== deliveryStatusFilter) {
      return false;
    }
    if (referrerTypeFilter !== "all" && invitation.referrer_type !== referrerTypeFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invitation.invite_target?.toLowerCase().includes(query) ||
        invitation.custom_code?.toLowerCase().includes(query) ||
        invitation.delivery_error?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Referral System Management</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Invitations</p>
                <p className="text-2xl font-bold">{stats?.totalInvitations || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.sentInvitations || 0} sent, {stats?.failedInvitations || 0} failed
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${stats?.totalEarnings?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Premium Referrals</p>
                <p className="text-2xl font-bold">{stats?.premiumReferrals || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Data */}
        <Card className="p-6">
          <Tabs defaultValue="invitations">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
              <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
              <TabsTrigger value="earnings">Earnings ({earnings.length})</TabsTrigger>
              <TabsTrigger value="payouts">Payouts ({payouts.length})</TabsTrigger>
            </TabsList>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="space-y-4 mt-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by email, phone, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={deliveryStatusFilter} onValueChange={setDeliveryStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Delivery Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={referrerTypeFilter} onValueChange={setReferrerTypeFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Referrer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invitations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-semibold">Method</th>
                      <th className="text-left p-2 text-sm font-semibold">Target</th>
                      <th className="text-left p-2 text-sm font-semibold">Referrer Type</th>
                      <th className="text-left p-2 text-sm font-semibold">Custom Code</th>
                      <th className="text-left p-2 text-sm font-semibold">Delivery Status</th>
                      <th className="text-left p-2 text-sm font-semibold">Sent At</th>
                      <th className="text-left p-2 text-sm font-semibold">Opened/Clicked</th>
                      <th className="text-left p-2 text-sm font-semibold">Error</th>
                      <th className="text-left p-2 text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((invitation) => (
                      <tr key={invitation.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {invitation.invite_method === 'email' ? (
                            <Mail className="w-4 h-4 text-primary" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-primary" />
                          )}
                        </td>
                        <td className="p-2 text-sm">{invitation.invite_target}</td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {invitation.referrer_type || 'user'}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm font-mono">
                          {invitation.custom_code || '-'}
                        </td>
                        <td className="p-2">
                          {getDeliveryStatusBadge(invitation.delivery_status || 'pending')}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {invitation.sent_at ? new Date(invitation.sent_at).toLocaleString() : '-'}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {invitation.opened_at && (
                            <div>Opened: {new Date(invitation.opened_at).toLocaleDateString()}</div>
                          )}
                          {invitation.clicked_at && (
                            <div>Clicked: {new Date(invitation.clicked_at).toLocaleDateString()}</div>
                          )}
                          {!invitation.opened_at && !invitation.clicked_at && '-'}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground max-w-xs truncate">
                          {invitation.delivery_error || '-'}
                        </td>
                        <td className="p-2">
                          {invitation.delivery_status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInvitation(invitation.id)}
                              className="text-xs"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredInvitations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No invitations found
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Other tabs remain the same */}
            <TabsContent value="referrals" className="space-y-4 mt-4">
              {referrals.map((referral) => (
                <Card key={referral.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Referral ID: {referral.id.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {referral.subscription_status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {referral.subscription_status === 'premium' && (
                      <Badge variant="outline" className="bg-success/10 text-success">
                        Premium
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4 mt-4">
              {earnings.map((earning) => (
                <Card key={earning.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">${earning.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        Month: {earning.month_year}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4 mt-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">${payout.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {payout.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(payout.payout_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{payout.status}</Badge>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}


