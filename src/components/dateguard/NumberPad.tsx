import { Delete, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const NumberPad = ({ value, onChange, maxLength = 3 }: NumberPadProps) => {
  const handleNumber = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="flex justify-center gap-4 mb-8">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 rounded-xl border-2 border-primary/30 bg-muted flex items-center justify-center"
          >
            {value[i] ? (
              <div className="w-4 h-4 rounded-full bg-primary"></div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30"></div>
            )}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            onClick={() => handleNumber(num.toString())}
            variant="outline"
            className="h-16 text-2xl font-semibold hover:bg-primary/10 hover:border-primary transition-all"
          >
            {num}
          </Button>
        ))}
        
        <Button
          onClick={handleDelete}
          variant="outline"
          className="h-16 hover:bg-destructive/10 hover:border-destructive transition-all"
        >
          <Delete className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={() => handleNumber("0")}
          variant="outline"
          className="h-16 text-2xl font-semibold hover:bg-primary/10 hover:border-primary transition-all"
        >
          0
        </Button>
        
        <Button
          onClick={handleClear}
          variant="outline"
          className="h-16 hover:bg-primary/10 hover:border-primary transition-all"
          disabled={value.length === 0}
        >
          <Check className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default NumberPad;
