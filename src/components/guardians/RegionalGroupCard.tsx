import { MapPin, Users, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RegionalGroupCardProps {
  group: {
    id: string;
    group_name: string;
    active_count: number;
    total_count: number;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RegionalGroupCard({ group, onEdit, onDelete }: RegionalGroupCardProps) {
  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30 hover:border-purple-500/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold uppercase">{group.group_name}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-white/60" />
          <p className="text-sm text-white/70">
            {group.active_count} guardian{group.active_count !== 1 ? 's' : ''}
            {group.total_count > group.active_count && (
              <span className="text-yellow-400"> • {group.total_count - group.active_count} pending</span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(group.id)}
            className="flex-1 h-8 text-xs border-white/20 text-white hover:bg-white/10"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(group.id)}
            className="flex-1 h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
