import { useRef, useEffect } from "react";

interface FaceScannerProps {
  isActive: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

const FaceScanner = ({ isActive, onStreamReady }: FaceScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isActive && !streamRef.current) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        onStreamReady?.(stream);
      }
    } catch (error) {
      console.error("Camera access error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Vairify-style circular face detection overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Dark overlay with circular cutout effect */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Circular frame */}
        <div className="relative z-10">
          {/* Main circle border with animated scanning effect */}
          <div className="relative w-64 h-64">
            {/* Circular border */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="opacity-80"
              />
              {/* Animated scanning arc */}
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray="75 225"
                strokeLinecap="round"
                className="animate-spin opacity-100"
                style={{ transformOrigin: 'center', animationDuration: '2s' }}
              />
            </svg>

            {/* Corner markers in circle */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-primary rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-3 border-b-3 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-3 border-b-3 border-primary rounded-br-lg"></div>
          </div>

          {/* Instruction text below circle */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-white text-sm font-medium bg-black/70 px-4 py-2 rounded-full border border-primary/30">
              Position face in circle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceScanner;
