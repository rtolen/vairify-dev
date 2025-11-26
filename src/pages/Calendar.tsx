import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/calendar/CalendarView";
import { AppointmentsList } from "@/components/calendar/AppointmentsList";
import { ScheduleTemplates } from "@/components/calendar/ScheduleTemplates";
import { CalendarSettings } from "@/components/calendar/CalendarSettings";

export default function Calendar() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Calendar</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentsList />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleTemplates />
          </TabsContent>

          <TabsContent value="settings">
            <CalendarSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
