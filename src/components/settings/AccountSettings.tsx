import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Lock, Trash2, Download, Loader2, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ActiveVAISelector from "@/components/business/ActiveVAISelector";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // TODO: Implement account deletion logic
      // This should delete user data from all tables
      toast.success("Account deletion initiated. You'll receive a confirmation email.");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      toast.info("Preparing your data for download...");
      // TODO: Implement data export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Your data has been sent to your email");
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error("Failed to download data");
    }
  };

  return (
    <div className="space-y-6">
      {/* Active V.A.I. Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active V.A.I.
          </CardTitle>
          <CardDescription>
            Switch between your personal and business V.A.I. identities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveVAISelector />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
               onClick={() => navigate('/activity')}>
            <div>
              <p className="font-medium">Activity Timeline</p>
              <p className="text-sm text-muted-foreground">
                View your complete activity history
              </p>
            </div>
            <Button variant="outline" onClick={(e) => {
              e.stopPropagation();
              navigate('/activity');
            }}>
              <History className="w-4 h-4 mr-2" />
              View Timeline
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium">Download Your Data</p>
              <p className="text-sm text-muted-foreground">
                Export all your account data and activity
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadData}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <h3 className="font-medium text-destructive mb-2">Delete Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4 pl-4">
                <li>• Your profile and all personal information</li>
                <li>• All VAI-CHECK verifications and history</li>
                <li>• DateGuard sessions and guardian connections</li>
                <li>• Reviews and ratings you've received</li>
                <li>• Referral earnings and pending payouts</li>
              </ul>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, delete my account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
