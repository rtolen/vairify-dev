import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  timezone: string;
}

interface ScheduleCalendarProps {
  schedules: ScheduleSlot[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatTime = (time: string) => {
  const [hour, min] = time.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${min} ${ampm}`;
};

export const ScheduleCalendar = ({ schedules }: ScheduleCalendarProps) => {
  const activeSchedules = schedules.filter(s => s.is_enabled);
  
  const getSchedulesForDay = (dayIndex: number) => {
    return activeSchedules.filter(s => s.day_of_week === dayIndex);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Preview
        </CardTitle>
        <CardDescription>
          Visual overview of your weekly availability schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, index) => {
            const daySchedules = getSchedulesForDay(index);
            const hasSchedules = daySchedules.length > 0;
            
            return (
              <div
                key={index}
                className={`rounded-lg border p-3 min-h-[120px] transition-colors ${
                  hasSchedules
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="font-semibold text-sm mb-2 text-center">
                  {day}
                </div>
                <div className="space-y-1">
                  {daySchedules.map((schedule, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-primary/10 rounded px-2 py-1 text-center"
                    >
                      <div className="font-medium">
                        {formatTime(schedule.start_time)}
                      </div>
                      <div className="text-muted-foreground">
                        {formatTime(schedule.end_time)}
                      </div>
                    </div>
                  ))}
                </div>
                {!hasSchedules && (
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    No schedule
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
