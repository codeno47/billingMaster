import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Bell, LogOut, User, KeyRound, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(5, "New password must be at least 5 characters").max(12, "New password must not exceed 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

function PasswordChangeDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const passwordChangeMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await apiRequest("PUT", "/api/auth/change-password", data);
      
      // Check if response is successful
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = "Failed to change password";
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || errorMessage;
        } catch {
          // If parsing fails, use the text response
          errorMessage = errorData || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Try to parse JSON response
      try {
        return await response.json();
      } catch {
        // If JSON parsing fails but response was successful, assume success
        return { message: "Password changed successfully" };
      }
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to change password";
      toast({
        title: "Password change failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PasswordChangeData) => {
    passwordChangeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password *</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="5-12 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm your new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={passwordChangeMutation.isPending}>
                {passwordChangeMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-100">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-left">
                    <div className="font-medium text-gray-700">{getDisplayName()}</div>
                    <div className="text-gray-500">{getRoleDisplay()}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <PasswordChangeDialog 
        isOpen={showPasswordDialog} 
        onClose={() => setShowPasswordDialog(false)} 
      />
    </nav>
  );
}
