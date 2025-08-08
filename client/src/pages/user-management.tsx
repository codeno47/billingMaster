import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users, Shield, AlertTriangle, Building2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/common/protected-route";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

// User form schema
const userFormSchema = z.object({
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required").min(5, "Password must be at least 5 characters").max(12, "Password must not exceed 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  email: z.string().email("Please enter a valid email address").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "finance"], { required_error: "Please select a role" }),
  costCentreIds: z.array(z.number()).optional().default([]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const updateUserFormSchema = z.object({
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  password: z.string().optional().refine((val) => {
    // If password is provided and not empty, it must meet length requirements
    if (val && val.trim().length > 0) {
      return val.length >= 5 && val.length <= 12;
    }
    return true; // Allow empty/undefined passwords
  }, "Password must be between 5-12 characters if provided"),
  confirmPassword: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "finance"], { required_error: "Please select a role" }),
  costCentreIds: z.array(z.number()).optional(),
}).refine((data) => {
  if (data.password && data.password.trim().length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userFormSchema>;
type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;

interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "finance";
  createdAt: string;
  updatedAt: string;
  costCentres?: CostCentre[];
}

interface CostCentre {
  id: number;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
}

function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isEditing = !!user;
  const [selectedCostCentres, setSelectedCostCentres] = useState<number[]>([]);

  // Fetch cost centres for selection - admin users can see all cost centres
  const { data: costCentres = [] } = useQuery<CostCentre[]>({
    queryKey: ["/api/config/cost-centres"],
  });

  // Fetch user's current cost centres if editing
  const { data: userCostCentres = [] } = useQuery<CostCentre[]>({
    queryKey: ["/api/users", user?.id, "cost-centres"],
    enabled: isEditing && !!user?.id,
  });

  const form = useForm<UserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserFormSchema : userFormSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      confirmPassword: "",
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      role: user?.role || "finance",
      costCentreIds: [],
    },
  });

  // Update selected cost centres when user data loads
  useEffect(() => {
    if (userCostCentres.length > 0) {
      const costCentreIds = userCostCentres.map(cc => cc.id);
      setSelectedCostCentres(costCentreIds);
      form.setValue('costCentreIds', costCentreIds);
    }
  }, [userCostCentres, form]);

  const mutation = useMutation({
    mutationFn: async (data: UserFormData | UpdateUserFormData) => {
      const url = isEditing ? `/api/users/${user.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Remove confirmPassword from data before sending to API
      const { confirmPassword, ...apiData } = data;
      
      // For updates, remove password if it's empty or just whitespace
      if (isEditing && (!apiData.password || apiData.password.trim() === '')) {
        const { password, ...dataWithoutPassword } = apiData;
        const response = await apiRequest(method, url, dataWithoutPassword);
        return response.json();
      }
      const response = await apiRequest(method, url, apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: isEditing ? "User updated" : "User created",
        description: `User has been successfully ${isEditing ? 'updated' : 'created'}`,
      });
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: isEditing ? "Update failed" : "Create failed",
        description: `Failed to ${isEditing ? 'update' : 'create'} user`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData | UpdateUserFormData) => {
    // Include selected cost centres in the submission
    const submitData = {
      ...data,
      costCentreIds: form.watch('role') === 'admin' ? [] : selectedCostCentres
    };
    mutation.mutate(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="finance">Finance Manager</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cost Centre Assignment Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="costCentreIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Centre Access {form.watch('role') === 'admin' ? '(Admin has access to all)' : ''}</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      {form.watch('role') === 'admin' 
                        ? 'Administrators automatically have access to all cost centres.' 
                        : `Select which cost centres this finance manager can access. ${currentUser?.role === 'admin' ? 'As an admin, you can assign any cost centre.' : ''} Leave empty for no access.`}
                    </div>
                    
                    {form.watch('role') !== 'admin' && (
                      <>
                        <Select 
                          onValueChange={(value) => {
                            const costCentreId = parseInt(value);
                            if (!selectedCostCentres.includes(costCentreId)) {
                              const newSelection = [...selectedCostCentres, costCentreId];
                              setSelectedCostCentres(newSelection);
                              form.setValue('costCentreIds', newSelection);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add cost centre access..." />
                          </SelectTrigger>
                          <SelectContent>
                            {costCentres.filter(cc => !selectedCostCentres.includes(cc.id)).map((costCentre) => (
                              <SelectItem key={costCentre.id} value={costCentre.id.toString()}>
                                {costCentre.code} - {costCentre.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="flex flex-wrap gap-2">
                          {selectedCostCentres.map((costCentreId) => {
                            const costCentre = costCentres.find(cc => cc.id === costCentreId);
                            if (!costCentre) return null;
                            
                            return (
                              <Badge key={costCentreId} variant="outline" className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {costCentre.code}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSelection = selectedCostCentres.filter(id => id !== costCentreId);
                                    setSelectedCostCentres(newSelection);
                                    form.setValue('costCentreIds', newSelection);
                                  }}
                                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password {isEditing ? "(leave blank to keep current)" : "*"}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder={isEditing ? "" : "5-12 characters"} />
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
                <FormLabel>Confirm Password {isEditing ? "(if changing password)" : "*"}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder={isEditing ? "" : "Confirm your password"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update User" : "Create User")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

function UserManagementContent() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Delete failed",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          description: 'Full access to all system features',
          variant: 'default' as const,
          icon: Shield
        };
      case 'finance':
        return {
          label: 'Finance Manager',
          description: 'Read-only access to most features',
          variant: 'secondary' as const,
          icon: Users
        };
      default:
        return {
          label: role,
          description: 'Unknown role',
          variant: 'outline' as const,
          icon: AlertTriangle
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm onSuccess={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Role Permissions:</strong> Administrators have full access to all features including user management, 
          employee data modification, and system configuration. Finance Managers have read-only access to most features 
          with limited editing capabilities.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>System Users ({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const RoleIcon = roleInfo.icon;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.email || 'No email'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={roleInfo.variant} className="flex items-center space-x-1">
                              <RoleIcon className="w-3 h-3" />
                              <span>{roleInfo.label}</span>
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {roleInfo.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog 
                              open={editUser?.id === user.id} 
                              onOpenChange={(open) => !open && setEditUser(null)}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                </DialogHeader>
                                <UserForm 
                                  user={user} 
                                  onSuccess={() => setEditUser(null)} 
                                />
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              disabled={user.id === currentUser?.id || deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserManagement() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserManagementContent />
    </ProtectedRoute>
  );
}