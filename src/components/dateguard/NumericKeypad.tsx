import { Button } from "@/components/ui/button";
import { X, Delete } from "lucide-react";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export const NumericKeypad = ({ value, onChange, maxLength = 6, disabled = false }: NumericKeypadProps) => {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="flex items-center justify-center gap-2 min-h-[60px]">
        {Array.from({ length: maxLength }).map((_, index) => (
          <div
            key={index}
            className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
              index < value.length
                ? "bg-white text-[#1B2B5E] border-white"
                : "bg-white/10 border-white/30 text-white/50"
            }`}
          >
            {value[index] || ""}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled || value.length >= maxLength}
            className="h-16 text-2xl font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            {num}
          </Button>
        ))}
        
        {/* Clear button */}
        <Button
          onClick={handleClear}
          disabled={disabled || value.length === 0}
          variant="ghost"
          className="h-16 text-white/70 hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>
        
        {/* Zero */}
        <Button
          onClick={() => handleNumberClick("0")}
          disabled={disabled || value.length >= maxLength}
          className="h-16 text-2xl font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30"
        >
          0
        </Button>
        
        {/* Backspace */}
        <Button
          onClick={handleBackspace}
          disabled={disabled || value.length === 0}
          variant="ghost"
          className="h-16 text-white/70 hover:bg-white/10"
        >
          <Delete className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};


