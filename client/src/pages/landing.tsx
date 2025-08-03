import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLine } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Employee Billing System</h1>
            <p className="text-gray-600">Secure access to billing management</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Sign in with your authorized account to access the billing management system.
              </p>
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-white hover:bg-blue-700 transition duration-200"
              >
                Sign In
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              <p>Access levels: Administrator & Finance Manager</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
