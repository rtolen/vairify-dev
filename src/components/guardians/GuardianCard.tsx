import { User, Mail, MessageCircle, Trash2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface Guardian {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  invited_at?: string;
}

interface GuardianCardProps {
  guardian: Guardian;
  onRemove: (id: string) => void;
  onResend?: (id: string) => void;
  groups?: string[];
}

export default function GuardianCard({ guardian, onRemove, onResend, groups = [] }: GuardianCardProps) {
  const isPending = guardian.status === "pending";
  const statusColor = isPending ? "text-yellow-400" : "text-green-400";
  const statusIcon = isPending ? "⏳" : "✅";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleMessage = () => {
    window.location.href = `sms:${guardian.phone}`;
  };

  return (
    <Card className="bg-white/5 border-white/20 hover:bg-white/10 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{guardian.name}</h3>
                <span className={statusColor}>{statusIcon}</span>
              </div>
            </div>

            <p className="text-sm text-white/60 mb-1">{guardian.phone}</p>
            
            <p className="text-xs text-white/50">
              {isPending 
                ? `Invited: ${formatDate(guardian.invited_at || guardian.created_at)}`
                : `Added: ${formatDate(guardian.created_at)}`
              }
            </p>

            {groups.length > 0 && (
              <p className="text-xs text-white/60 mt-1">
                Groups: {groups.join(", ")}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {!isPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMessage}
                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
              )}

              {isPending && onResend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResend(guardian.id)}
                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Resend
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {isPending ? <X className="w-3 h-3 mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                    {isPending ? "Cancel" : "Remove"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">
                      {isPending ? "Cancel Invitation?" : "Remove Guardian?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      {isPending 
                        ? `Are you sure you want to cancel the invitation to ${guardian.name}?`
                        : `Are you sure you want to remove ${guardian.name} as a guardian? They will no longer be able to monitor your DateGuard sessions or receive emergency alerts.`
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemove(guardian.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isPending ? "Cancel Invitation" : "Remove Guardian"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
