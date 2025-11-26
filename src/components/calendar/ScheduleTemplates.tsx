import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [slots, setSlots] = useState<Array<{ day: number; start: string; end: string }>>([]);

  const { data: templates } = useQuery({
    queryKey: ["schedule-templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("schedule_templates")
        .select(`
          *,
          schedule_time_slots(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: template, error: templateError } = await supabase
        .from("schedule_templates")
        .insert({
          user_id: user.id,
          template_name: templateName,
          is_active: false,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      if (slots.length > 0) {
        const { error: slotsError } = await supabase
          .from("schedule_time_slots")
          .insert(
            slots.map(slot => ({
              template_id: template.id,
              day_of_week: slot.day,
              start_time: slot.start,
              end_time: slot.end,
            }))
          );

        if (slotsError) throw slotsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-templates"] });
      setIsCreating(false);
      setTemplateName("");
      setSlots([]);
      toast({
        title: "Template created",
        description: "Your schedule template has been created successfully.",
      });
    },
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("schedule_templates")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-templates"] });
    },
  });

  const addSlot = () => {
    setSlots([...slots, { day: 1, start: "09:00", end: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Schedule Templates</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Schedule Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Weekday Schedule"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Time Slots</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>

                {slots.map((slot, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Day</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={slot.day}
                          onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index].day = parseInt(e.target.value);
                            setSlots(newSlots);
                          }}
                        >
                          {DAYS.map((day, i) => (
                            <option key={i} value={i}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index].start = e.target.value;
                            setSlots(newSlots);
                          }}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index].end = e.target.value;
                            setSlots(newSlots);
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => createTemplate.mutate()}
                disabled={!templateName || createTemplate.isPending}
                className="w-full"
              >
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{template.template_name}</h3>
              <Switch
                checked={template.is_active}
                onCheckedChange={() =>
                  toggleTemplate.mutate({ id: template.id, isActive: template.is_active })
                }
              />
            </div>
            <div className="space-y-2">
              {/* @ts-ignore */}
              {template.schedule_time_slots?.map((slot) => (
                <div key={slot.id} className="text-sm text-muted-foreground">
                  {DAYS[slot.day_of_week]}: {slot.start_time} - {slot.end_time}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
