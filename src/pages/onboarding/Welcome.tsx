import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";
import vairifyLogo from "@/assets/vairify-logo.png";

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: "📍",
      title: "DateGuard",
      description: "Your protection - your people - your way",
      isCustomIcon: false
    },
    {
      icon: "check",
      title: "VAI-CHECK",
      description: "In-person verification instantly",
      isCustomIcon: true
    },
    {
      icon: "⭐",
      title: "TruRevu",
      description: "Accurate unfakeable reviews",
      isCustomIcon: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Language selector in top right */}
      <button
        onClick={() => navigate("/onboarding/language")}
        className="absolute top-6 right-6 z-20 bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
        aria-label="Select language"
      >
        <Globe className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
      </button>

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
          <p className="text-lg text-white/80 font-semibold tracking-wide">
            Verified - Anonymous - Accountable
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-3 flex justify-center">
                {feature.isCustomIcon ? (
                  <Check className="w-10 h-10 text-[#00FF00]" strokeWidth={4} />
                ) : (
                  <span className="text-4xl">{feature.icon}</span>
                )}
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{feature.title}</h3>
              <p className="text-white/80 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/onboarding/registration")}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-white text-primary hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Button>
          <button 
            onClick={() => navigate("/login")}
            className="w-full text-white/90 hover:text-white text-sm transition-colors"
          >
            Already have an account? <span className="underline font-semibold">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
