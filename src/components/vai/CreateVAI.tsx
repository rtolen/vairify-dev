import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Step = "intro" | "camera" | "processing" | "success";

const CreateVAI = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [vaiNumber, setVaiNumber] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const generateVAINumber = () => {
    // Generate random 7-character V.A.I. number
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setStep("camera");
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const handleCapture = () => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setStep("processing");
    
    // Simulate processing
    setTimeout(() => {
      const newVaiNumber = generateVAINumber();
      setVaiNumber(newVaiNumber);
      setStep("success");
    }, 2000);
  };

  const handleContinue = () => {
    navigate("/feed");
  };

  const handleBack = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {/* Intro Step */}
          {step === "intro" && (
            <div className="space-y-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Login</span>
              </button>

              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                
                <h2 className="text-foreground text-2xl font-semibold">
                  Create Your V.A.I.
                </h2>
                
                <p className="text-muted-foreground">
                  Take a quick selfie to create your verified identity
                </p>
              </div>

              <Button
                onClick={handleStartCamera}
                className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We use your photo to create a secure, anonymous identity that protects your privacy
              </p>
            </div>
          )}

          {/* Camera Step */}
          {step === "camera" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-foreground text-xl font-semibold mb-2">
                  Position Your Face
                </h2>
                <p className="text-muted-foreground text-sm">
                  Align your face within the circle
                </p>
              </div>

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

              <Button
                onClick={handleCapture}
                className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold"
              >
                <Camera className="w-5 h-5 mr-2" />
                CAPTURE PHOTO
              </Button>

              <button
                onClick={handleBack}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              
              <div>
                <h2 className="text-foreground text-xl font-semibold mb-2">
                  Processing...
                </h2>
                <p className="text-muted-foreground">
                  Creating your V.A.I...
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                
                <h2 className="text-foreground text-2xl font-semibold">
                  ✅ V.A.I. Created!
                </h2>
              </div>

              <div className="bg-muted rounded-xl p-6 space-y-3">
                <p className="text-muted-foreground text-sm text-center">
                  Your V.A.I. Number:
                </p>
                <p className="text-foreground text-3xl font-mono font-bold text-center tracking-wider">
                  {vaiNumber}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-foreground text-sm font-medium mb-1">
                  📝 Save this number
                </p>
                <p className="text-muted-foreground text-sm">
                  Use it to login securely. You can also find it on your dashboard.
                </p>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full h-14 bg-gradient-primary hover:brightness-110 text-primary-foreground font-semibold"
              >
                Continue to App
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateVAI;
