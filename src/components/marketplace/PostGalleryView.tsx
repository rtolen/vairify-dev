import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PostGalleryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrls: string[];
  initialIndex?: number;
}

export const PostGalleryView = ({
  open,
  onOpenChange,
  mediaUrls,
  initialIndex = 0,
}: PostGalleryViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-screen p-0 bg-black">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image */}
          <img
            src={mediaUrls[currentIndex]}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation */}
          {mediaUrls.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-3 hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-3 hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {mediaUrls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
