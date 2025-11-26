import { Shield, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface VerificationEvent {
  id: string;
  type: "verification" | "update" | "review";
  status: "completed" | "pending" | "failed";
  timestamp: string;
  description: string;
}

interface VAIVerificationHistoryProps {
  events: VerificationEvent[];
}

export const VAIVerificationHistory = ({ events }: VAIVerificationHistoryProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Verification History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No verification history yet</p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.description}</p>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
