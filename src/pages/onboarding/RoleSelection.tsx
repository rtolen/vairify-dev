import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import vairifyLogo from "@/assets/vairify-logo.png";

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'provider' | 'client') => {
    sessionStorage.setItem('vairify_role', role);
    navigate("/onboarding/registration");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/onboarding/language")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
          <img src={vairifyLogo} alt="VAIRIFY" className="w-30 h-30 md:w-48 md:h-48" />
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            I Am Looking To Use
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            Vairify As:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Provider Card */}
            <button
              onClick={() => handleRoleSelect('provider')}
              className="group bg-white/10 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300 animate-slide-up"
            >
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Provider</h3>
              <p className="text-white/80 text-lg">
                Offer services, build reputation, stay safe
              </p>
            </button>

            {/* Client Card */}
            <button
              onClick={() => handleRoleSelect('client')}
              className="group bg-white/10 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Client/Hobbyist</h3>
              <p className="text-white/80 text-lg">
                Find verified providers, book safely
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
