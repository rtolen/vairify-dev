import { Camera, Shield, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold text-foreground mb-4">🚀 Quick Actions</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <Card 
          onClick={() => navigate("/vai-check")}
          className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-600 to-cyan-600 border-0"
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">START<br/>VAI-CHECK</h3>
              <p className="text-xs text-white/80 mt-1">Verify identity</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => navigate("/dateguard")}
          className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-purple-600 to-purple-800 border-0"
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">SETUP<br/>DATEGUARD</h3>
              <p className="text-xs text-white/80 mt-1">Add guardians</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => navigate("/available-now")}
          className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-green-600 to-emerald-600 border-0"
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">AVAILABLE<br/>NOW</h3>
              <p className="text-xs text-white/80 mt-1">Find nearby</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
