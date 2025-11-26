import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";

interface ScheduleTemplate {
  name: string;
  description: string;
  schedules: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

const TEMPLATES: ScheduleTemplate[] = [
  {
    name: "Weekdays 9-5",
    description: "Monday through Friday, standard business hours",
    schedules: [
      { day_of_week: 1, start_time: "09:00:00", end_time: "17:00:00" },
      { day_of_week: 2, start_time: "09:00:00", end_time: "17:00:00" },
      { day_of_week: 3, start_time: "09:00:00", end_time: "17:00:00" },
      { day_of_week: 4, start_time: "09:00:00", end_time: "17:00:00" },
      { day_of_week: 5, start_time: "09:00:00", end_time: "17:00:00" },
    ],
  },
  {
    name: "Evenings",
    description: "Monday through Friday, 6 PM - 11 PM",
    schedules: [
      { day_of_week: 1, start_time: "18:00:00", end_time: "23:00:00" },
      { day_of_week: 2, start_time: "18:00:00", end_time: "23:00:00" },
      { day_of_week: 3, start_time: "18:00:00", end_time: "23:00:00" },
      { day_of_week: 4, start_time: "18:00:00", end_time: "23:00:00" },
      { day_of_week: 5, start_time: "18:00:00", end_time: "23:00:00" },
    ],
  },
  {
    name: "Weekends",
    description: "Saturday and Sunday, 10 AM - 8 PM",
    schedules: [
      { day_of_week: 0, start_time: "10:00:00", end_time: "20:00:00" },
      { day_of_week: 6, start_time: "10:00:00", end_time: "20:00:00" },
    ],
  },
  {
    name: "All Week",
    description: "Every day, 9 AM - 9 PM",
    schedules: [
      { day_of_week: 0, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 1, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 2, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 3, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 4, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 5, start_time: "09:00:00", end_time: "21:00:00" },
      { day_of_week: 6, start_time: "09:00:00", end_time: "21:00:00" },
    ],
  },
  {
    name: "Flexible Schedule",
    description: "Varied hours throughout the week",
    schedules: [
      { day_of_week: 1, start_time: "10:00:00", end_time: "14:00:00" },
      { day_of_week: 2, start_time: "14:00:00", end_time: "20:00:00" },
      { day_of_week: 3, start_time: "10:00:00", end_time: "14:00:00" },
      { day_of_week: 4, start_time: "14:00:00", end_time: "20:00:00" },
      { day_of_week: 5, start_time: "18:00:00", end_time: "23:00:00" },
      { day_of_week: 6, start_time: "10:00:00", end_time: "18:00:00" },
    ],
  },
];

interface ScheduleTemplatesProps {
  onApplyTemplate: (template: ScheduleTemplate) => void;
  disabled?: boolean;
}

export const ScheduleTemplates = ({ onApplyTemplate, disabled }: ScheduleTemplatesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Quick Templates
        </CardTitle>
        <CardDescription>
          Apply pre-configured schedule patterns to get started quickly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((template) => (
            <div
              key={template.name}
              className="border rounded-lg p-4 space-y-2 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onApplyTemplate(template)}
                disabled={disabled}
              >
                Apply Template
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
