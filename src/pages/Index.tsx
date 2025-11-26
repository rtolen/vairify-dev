import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import vairifyLogo from "@/assets/vairify-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const vai = searchParams.get("vai");
    if (vai) {
      navigate(`/login?vai=${vai}`);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-light/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img src={vairifyLogo} alt="VAIRIFY" className="w-52 h-52 md:w-64 md:h-64" />
          </div>
        </div>

        {/* Hero content */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Stop Hoping.<br />Start Knowing.
          </h1>
          <p className="text-xl text-white/90 max-w-md mx-auto">
            The first platform with V.A.I. verified anonymous identity for every encounter.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/onboarding/registration")}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            Sign Up
          </Button>
          <Button 
            onClick={() => navigate("/login")}
            size="lg"
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-primary transition-all duration-300"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
