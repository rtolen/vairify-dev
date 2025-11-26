import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerProps {
  hours: number;
  minutes: number;
  seconds: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
}

export const TimePicker = ({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
}: TimePickerProps) => {
  const increment = (value: number, max: number, onChange: (val: number) => void) => {
    onChange(value >= max ? 0 : value + 1);
  };

  const decrement = (value: number, max: number, onChange: (val: number) => void) => {
    onChange(value <= 0 ? max : value - 1);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Hours */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => increment(hours, 23, onHoursChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <div className="text-6xl font-bold text-white min-w-[80px] text-center">
          {hours.toString().padStart(2, "0")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => decrement(hours, 23, onHoursChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <div className="text-sm text-white/60 mt-2">Hours</div>
      </div>

      <div className="text-6xl font-bold text-white/60">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => increment(minutes, 59, onMinutesChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <div className="text-6xl font-bold text-white min-w-[80px] text-center">
          {minutes.toString().padStart(2, "0")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => decrement(minutes, 59, onMinutesChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <div className="text-sm text-white/60 mt-2">Minutes</div>
      </div>

      <div className="text-6xl font-bold text-white/60">:</div>

      {/* Seconds */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => increment(seconds, 59, onSecondsChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <div className="text-6xl font-bold text-white min-w-[80px] text-center">
          {seconds.toString().padStart(2, "0")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => decrement(seconds, 59, onSecondsChange)}
          className="text-white hover:bg-white/10 h-12 w-12"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <div className="text-sm text-white/60 mt-2">Seconds</div>
      </div>
    </div>
  );
};


