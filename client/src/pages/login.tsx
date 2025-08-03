import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginRequest } from "@shared/schema";
import { LogIn, Users, DollarSign } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome to the Employee Billing Management System",
      });
      // Invalidate auth query to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  const fillDemo = (role: 'admin' | 'finance') => {
    if (role === 'admin') {
      form.setValue('username', 'admin');
      form.setValue('password', 'admin123');
    } else {
      form.setValue('username', 'finance');
      form.setValue('password', 'finance123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Demo Accounts:
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => fillDemo('admin')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Admin
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => fillDemo('finance')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Finance
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Admin: Full access • Finance: View & limited editing
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}