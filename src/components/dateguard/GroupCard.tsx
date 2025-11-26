import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Users, Edit2 } from "lucide-react";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    members: Array<{ phone: string; name: string }>;
  };
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit?: () => void;
}

export const GroupCard = ({ group, selected, onSelect, onEdit }: GroupCardProps) => {
  const memberCount = group.members?.length || 0;

  return (
    <Card
      className={`bg-white/10 border-2 backdrop-blur-sm cursor-pointer transition-all ${
        selected ? "border-white bg-white/20" : "border-white/20 hover:border-white/40"
      }`}
      onClick={() => onSelect(!selected)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#1B2B5E]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white/80" />
              <p className="font-semibold text-white">{group.name}</p>
            </div>
            <p className="text-sm text-white/60 mt-1">
              {memberCount} {memberCount === 1 ? "guardian" : "guardians"}
            </p>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-white hover:bg-white/10"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


