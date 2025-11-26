import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Shield, Crown, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

export default function UserManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/feed');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        // Get roles for each user
        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);
            
            return {
              ...profile,
              roles: roles?.map(r => r.role) || []
            };
          })
        );
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: 'admin' | 'moderator') => {
    try {
      const user = users.find(u => u.id === userId);
      const hasRole = user?.roles?.includes(role);

      if (hasRole) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
      } else {
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
      }

      toast.success(hasRole ? `Removed ${role} role` : `Granted ${role} role`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error("Failed to update role");
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground">{users.length} total users</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">
                      {user.subscription_status || 'free'}
                    </Badge>
                    {user.roles?.map((role: string) => (
                      <Badge
                        key={role}
                        className={
                          role === 'admin'
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-warning text-warning-foreground'
                        }
                      >
                        {role === 'admin' ? <Crown className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                        {role}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={user.roles?.includes('admin') ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(user.id, 'admin')}
                  >
                    {user.roles?.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                  </Button>
                  <Button
                    variant={user.roles?.includes('moderator') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(user.id, 'moderator')}
                  >
                    {user.roles?.includes('moderator') ? 'Remove Mod' : 'Make Mod'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No users found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
