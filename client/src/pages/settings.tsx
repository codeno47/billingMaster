import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Building2, Award, Clock, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/common/protected-route";
import { apiRequest } from "@/lib/queryClient";

// Schema definitions for forms
const costCentreSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
});

const bandSchema = z.object({
  level: z.string().min(1, "Level is required"),
  name: z.string().min(1, "Name is required"),
  minRate: z.string().min(1, "Minimum rate is required"),
  maxRate: z.string().min(1, "Maximum rate is required"),
});

const shiftSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().optional(),
});

const roleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().optional(),
  level: z.string().optional(),
});

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().optional(),
  manager: z.string().optional(),
});

type CostCentreForm = z.infer<typeof costCentreSchema>;
type BandForm = z.infer<typeof bandSchema>;
type ShiftForm = z.infer<typeof shiftSchema>;
type RoleForm = z.infer<typeof roleSchema>;
type TeamForm = z.infer<typeof teamSchema>;

interface ConfigTableProps<T extends { id: number }> {
  title: string;
  icon: any;
  data: T[];
  columns: { key: keyof T; label: string }[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

function ConfigTable<T extends { id: number }>({ 
  title, 
  icon: Icon, 
  data, 
  columns, 
  onAdd, 
  onEdit, 
  onDelete, 
  isLoading 
}: ConfigTableProps<T>) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add {title.slice(0, -1)}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={String(column.key)}>{column.label}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8">
                    <div className="animate-pulse">Loading...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                    No {title.toLowerCase()} found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {String(item[column.key] || '')}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("cost-centres");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch configuration data
  const { data: costCentres = [], isLoading: costCentresLoading } = useQuery<any[]>({
    queryKey: ["/api/config/cost-centres"],
  });

  const { data: bands = [], isLoading: bandsLoading } = useQuery<any[]>({
    queryKey: ["/api/config/bands"],
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: ["/api/config/shifts"],
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ["/api/config/roles"],
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ["/api/config/teams"],
  });

  // Generic mutation for all config types
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      const response = await apiRequest("POST", endpoint, data);
      return await response.json();
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Item created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: number; data: any }) => {
      console.log("Frontend updating:", endpoint, id, data);
      try {
        const response = await apiRequest("PUT", `${endpoint}/${id}`, data);
        const result = await response.json();
        console.log("API request successful:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (result, { endpoint }) => {
      console.log("Update successful:", result);
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Item updated successfully" });
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      const errorMessage = error?.message || "Failed to update item";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: number }) => {
      const response = await apiRequest("DELETE", `${endpoint}/${id}`);
      return await response.json();
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: "Success", description: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    },
  });

  // Forms
  const costCentreForm = useForm<CostCentreForm>({
    resolver: zodResolver(costCentreSchema),
    defaultValues: { code: "", description: "" },
  });

  const bandForm = useForm<BandForm>({
    resolver: zodResolver(bandSchema),
    defaultValues: { level: "", name: "", minRate: "", maxRate: "" },
  });

  const shiftForm = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: { name: "", startTime: "", endTime: "", timezone: "" },
  });

  const roleForm = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { title: "", department: "", level: "" },
  });

  const teamForm = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", department: "", manager: "" },
  });

  // Generic handlers
  const handleAdd = (type: string) => {
    setEditingItem(null);
    setActiveTab(type);
    setIsDialogOpen(true);
    resetForms();
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem(item);
    setActiveTab(type);
    setIsDialogOpen(true);
    populateForm(item, type);
  };

  const handleDelete = (id: number, endpoint: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  const resetForms = () => {
    costCentreForm.reset();
    bandForm.reset();
    shiftForm.reset();
    roleForm.reset();
    teamForm.reset();
  };

  const populateForm = (item: any, type: string) => {
    switch (type) {
      case "cost-centres":
        costCentreForm.reset(item);
        break;
      case "bands":
        bandForm.reset(item);
        break;
      case "shifts":
        shiftForm.reset(item);
        break;
      case "roles":
        roleForm.reset(item);
        break;
      case "teams":
        teamForm.reset(item);
        break;
    }
  };

  const handleSubmit = (data: any, endpoint: string) => {
    if (editingItem) {
      updateMutation.mutate({ endpoint, id: editingItem.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure billing settings and master data for the Elixr Labs billing management system</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cost-centres">Cost Centres</TabsTrigger>
          <TabsTrigger value="bands">Bands</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="cost-centres">
          <ConfigTable
            title="Cost Centres"
            icon={Building2}
            data={costCentres}
            columns={[
              { key: "code", label: "Code" },
              { key: "description", label: "Description" },
            ]}
            onAdd={() => handleAdd("cost-centres")}
            onEdit={(item) => handleEdit(item, "cost-centres")}
            onDelete={(id) => handleDelete(id, "/api/config/cost-centres")}
            isLoading={costCentresLoading}
          />
        </TabsContent>

        <TabsContent value="bands">
          <ConfigTable
            title="Bands"
            icon={Award}
            data={bands}
            columns={[
              { key: "level", label: "Level" },
              { key: "name", label: "Name" },
              { key: "minRate", label: "Min Rate" },
              { key: "maxRate", label: "Max Rate" },
            ]}
            onAdd={() => handleAdd("bands")}
            onEdit={(item) => handleEdit(item, "bands")}
            onDelete={(id) => handleDelete(id, "/api/config/bands")}
            isLoading={bandsLoading}
          />
        </TabsContent>

        <TabsContent value="shifts">
          <ConfigTable
            title="Shifts"
            icon={Clock}
            data={shifts}
            columns={[
              { key: "name", label: "Name" },
              { key: "startTime", label: "Start Time" },
              { key: "endTime", label: "End Time" },
              { key: "timezone", label: "Timezone" },
            ]}
            onAdd={() => handleAdd("shifts")}
            onEdit={(item) => handleEdit(item, "shifts")}
            onDelete={(id) => handleDelete(id, "/api/config/shifts")}
            isLoading={shiftsLoading}
          />
        </TabsContent>

        <TabsContent value="roles">
          <ConfigTable
            title="Roles"
            icon={UserCheck}
            data={roles}
            columns={[
              { key: "title", label: "Title" },
              { key: "department", label: "Department" },
              { key: "level", label: "Level" },
            ]}
            onAdd={() => handleAdd("roles")}
            onEdit={(item) => handleEdit(item, "roles")}
            onDelete={(id) => handleDelete(id, "/api/config/roles")}
            isLoading={rolesLoading}
          />
        </TabsContent>

        <TabsContent value="teams">
          <ConfigTable
            title="Teams"
            icon={Users}
            data={teams}
            columns={[
              { key: "name", label: "Name" },
              { key: "department", label: "Department" },
              { key: "manager", label: "Manager" },
            ]}
            onAdd={() => handleAdd("teams")}
            onEdit={(item) => handleEdit(item, "teams")}
            onDelete={(id) => handleDelete(id, "/api/config/teams")}
            isLoading={teamsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </DialogTitle>
          </DialogHeader>

          {activeTab === "cost-centres" && (
            <Form {...costCentreForm}>
              <form onSubmit={costCentreForm.handleSubmit((data) => handleSubmit(data, "/api/config/cost-centres"))} className="space-y-4">
                <FormField
                  control={costCentreForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MH-BYN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={costCentreForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Mumbai Borivali office operations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === "bands" && (
            <Form {...bandForm}>
              <form onSubmit={bandForm.handleSubmit((data) => handleSubmit(data, "/api/config/bands"))} className="space-y-4">
                <FormField
                  control={bandForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., B1, B2, B3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bandForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Junior, Senior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bandForm.control}
                    name="minRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Rate *</FormLabel>
                        <FormControl>
                          <Input placeholder="25.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bandForm.control}
                    name="maxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Rate *</FormLabel>
                        <FormControl>
                          <Input placeholder="35.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === "shifts" && (
            <Form {...shiftForm}>
              <form onSubmit={shiftForm.handleSubmit((data) => handleSubmit(data, "/api/config/shifts"))} className="space-y-4">
                <FormField
                  control={shiftForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Day Shift, Night Shift" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={shiftForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input placeholder="09:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shiftForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input placeholder="18:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={shiftForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IST, EST, GMT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === "roles" && (
            <Form {...roleForm}>
              <form onSubmit={roleForm.handleSubmit((data) => handleSubmit(data, "/api/config/roles"))} className="space-y-4">
                <FormField
                  control={roleForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engineering, Operations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roleForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Individual Contributor, Management" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {activeTab === "teams" && (
            <Form {...teamForm}>
              <form onSubmit={teamForm.handleSubmit((data) => handleSubmit(data, "/api/config/teams"))} className="space-y-4">
                <FormField
                  control={teamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Frontend Development" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engineering, Operations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech Lead, Senior Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute requiredRole="admin">
      <SettingsContent />
    </ProtectedRoute>
  );
}
