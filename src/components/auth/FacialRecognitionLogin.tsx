import { useState, useRef, useEffect } from "react";
import { Camera, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as faceapi from "face-api.js";

interface FacialRecognitionLoginProps {
  vaiNumber: string;
  storedPhotoUrl: string;
  onSuccess: () => void;
  onFailure: () => void;
  onFallback: () => void;
}

export default function FacialRecognitionLogin({
  vaiNumber,
  storedPhotoUrl,
  onSuccess,
  onFailure,
  onFallback,
}: FacialRecognitionLoginProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Place models in public/models folder
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load face-api.js models:", error);
        toast({
          title: "Model Loading Failed",
          description: "Facial recognition models could not be loaded. Please use email/password login.",
          variant: "destructive",
        });
        setIsLoading(false);
        onFallback();
      }
    };

    loadModels();
  }, [toast, onFallback]);

  // Start camera stream
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: "user" 
          },
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access error:", error);
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access or use email/password login.",
          variant: "destructive",
        });
        onFallback();
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [modelsLoaded, toast, onFallback]);

  // Real-time face detection overlay
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) return;

    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detect = async () => {
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(detect);
          return;
        }

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw face detection box
        detections.forEach((detection) => {
          const box = detection.detection.box;
          ctx.strokeStyle = detections.length === 1 ? "#10b981" : "#ef4444";
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Draw landmarks
          if (detection.landmarks) {
            ctx.fillStyle = "#10b981";
            detection.landmarks.positions.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        });

        if (!isCapturing && !isVerifying) {
          requestAnimationFrame(detect);
        }
      };

      detect();
    };

    detectFace();
  }, [modelsLoaded, isCapturing, isVerifying]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    setIsCapturing(true);
    setIsVerifying(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Capture frame
      ctx.drawImage(video, 0, 0);
      const capturedImage = canvas.toDataURL("image/jpeg", 0.9);
      const capturedBase64 = capturedImage.split(",")[1];

      // Load stored photo for comparison
      const storedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = storedPhotoUrl;
      });

      // Create canvas for stored image
      const storedCanvas = document.createElement("canvas");
      storedCanvas.width = storedImage.width;
      storedCanvas.height = storedImage.height;
      const storedCtx = storedCanvas.getContext("2d");
      if (!storedCtx) throw new Error("Could not get stored canvas context");
      storedCtx.drawImage(storedImage, 0, 0);

      // Detect faces and get descriptors
      const [capturedDescriptor, storedDescriptor] = await Promise.all([
        faceapi
          .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor(),
        faceapi
          .detectSingleFace(storedCanvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor(),
      ]);

      if (!capturedDescriptor || !storedDescriptor) {
        throw new Error("Could not detect face in one or both images");
      }

      // Calculate distance (lower = more similar)
      const distance = faceapi.euclideanDistance(
        capturedDescriptor.descriptor,
        storedDescriptor.descriptor
      );

      // Convert distance to confidence percentage
      // face-api.js distance: 0-1, typically <0.6 = same person
      // Convert to confidence: (1 - distance) * 100
      const confidenceScore = Math.max(0, Math.min(100, (1 - distance) * 100));
      setConfidence(confidenceScore);

      console.log("Face comparison - Distance:", distance, "Confidence:", confidenceScore);

      // Check if confidence > 85%
      if (confidenceScore >= 85) {
        toast({
          title: "Verification Successful",
          description: `Identity confirmed (${confidenceScore.toFixed(1)}% match)`,
        });
        onSuccess();
      } else {
        throw new Error(
          `Verification failed. Confidence: ${confidenceScore.toFixed(1)}% (required: 85%)`
        );
      }
    } catch (error: any) {
      console.error("Face verification error:", error);
      setConfidence(null);
      toast({
        title: "Verification Failed",
        description: error.message || "Face verification failed. Please try again.",
        variant: "destructive",
      });
      setIsVerifying(false);
      setIsCapturing(false);
      onFailure();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm">Loading facial recognition models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Facial Recognition Login</h3>
        <p className="text-sm text-muted-foreground">
          Position your face in the frame. Make sure you have good lighting.
        </p>
      </div>

      {/* Camera Preview */}
      <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden border-2 border-border">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
        {isVerifying && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-white font-medium">Verifying...</p>
              {confidence !== null && (
                <p className="text-white/80 text-sm">Confidence: {confidence.toFixed(1)}%</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
        <p className="font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Face centered in frame
        </p>
        <p className="font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Good lighting (face well-lit)
        </p>
        <p className="font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Remove glasses if possible
        </p>
        <p className="font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Look directly at camera
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleCapture}
          disabled={isVerifying || !modelsLoaded}
          className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold text-base"
        >
          <Camera className="w-5 h-5 mr-2" />
          {isVerifying ? "Verifying..." : "Capture & Verify"}
        </Button>

        <Button
          onClick={onFallback}
          variant="outline"
          className="w-full"
          disabled={isVerifying}
        >
          Use Email/Password Instead
        </Button>
      </div>

      {confidence !== null && confidence < 85 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Verification failed ({confidence.toFixed(1)}% confidence). Please try again or use email/password.
          </p>
        </div>
      )}
    </div>
  );
}

