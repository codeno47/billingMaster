import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Bell, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Navbar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to login page after logout
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if (firstName) {
      return firstName.slice(0, 2);
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  const getRoleDisplay = () => {
    return user?.role === 'admin' ? 'Administrator' : 'Finance Manager';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Elixr Labs Billing System</h1>
            <p className="text-sm text-gray-600">{getRoleDisplay()} Dashboard</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium text-gray-700">{getDisplayName()}</div>
                <div className="text-gray-500">{getRoleDisplay()}</div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
