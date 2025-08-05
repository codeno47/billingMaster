import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import EmployeeTable from "@/components/employees/employee-table";
import EmployeeForm from "@/components/employees/employee-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Download, Trash2, RotateCcw } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    search: "",
    team: "all",
    status: "all",
    role: "all",
    costCentre: "all",
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });
  
  const [sortConfig, setSortConfig] = useState({
    sortBy: "name",
    sortOrder: "asc" as "asc" | "desc",
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["/api/employees", filters, pagination, sortConfig],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      });
      
      const response = await fetch(`/api/employees?${params}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/employees/teams"],
    queryFn: async () => {
      const response = await fetch("/api/employees/teams");
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: costCentres = [] } = useQuery({
    queryKey: ["/api/employees/cost-centres"],
    queryFn: async () => {
      const response = await fetch("/api/employees/cost-centres");
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      // Include current filters in the export request
      const params = new URLSearchParams({
        ...filters,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      });
      
      const response = await fetch(`/api/employees/export?${params}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Generate filename based on applied filters
      const filterSuffix = hasActiveFilters() ? '_filtered' : '';
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `employees${filterSuffix}_${timestamp}.csv`;
      
      a.href = url;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      const filterCount = getActiveFilterCount();
      const description = filterCount > 0 
        ? `Exported ${employeesData?.total || 0} filtered employee records to CSV`
        : `Exported ${employeesData?.total || 0} employee records to CSV`;
      
      toast({
        title: "Export successful",
        description,
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
        title: "Export failed",
        description: "Failed to export employee data",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/employees/import', formData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Import successful",
        description: `Imported ${data.imported} employees. ${data.errors.length} errors.`,
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
        title: "Import failed",
        description: "Failed to import employee data",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/employees');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/teams"] });
      toast({
        title: "Data cleared",
        description: "All employee data has been successfully cleared",
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
        title: "Clear failed",
        description: "Failed to clear employee data",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      team: "all",
      status: "all",
      role: "all",
      costCentre: "all",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Check if any filters are active (excluding default "all" values)
  const hasActiveFilters = () => {
    return filters.search !== "" || 
           filters.team !== "all" || 
           filters.status !== "all" || 
           filters.role !== "all" || 
           filters.costCentre !== "all";
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search !== "") count++;
    if (filters.team !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.role !== "all") count++;
    if (filters.costCentre !== "all") count++;
    return count;
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <p className="text-gray-600">Manage employee records and billing information</p>
      </div>

      <Card className="p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Employees</h2>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            {isAdmin && (
              <>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" disabled={importMutation.isPending}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Employee Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all employee records from the database. 
                        This cannot be undone. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => clearDataMutation.mutate()}
                        disabled={clearDataMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Clear All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                    </DialogHeader>
                    <EmployeeForm onSuccess={() => setShowAddForm(false)} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-800">Filter Employees</h3>
              {hasActiveFilters() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters()}
              className={`${hasActiveFilters() ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400 cursor-not-allowed'}`}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search employees..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
            
            <Select value={filters.team} onValueChange={(value) => handleFilterChange("team", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team: string) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Dev">Developer</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="OPS">Operations</SelectItem>
                <SelectItem value="EXR">EXR</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.costCentre} onValueChange={(value) => handleFilterChange("costCentre", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Cost Centres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Centres</SelectItem>
                <SelectItem value="none">Not Assigned</SelectItem>
                {costCentres.map((centre: string) => (
                  <SelectItem key={centre} value={centre}>
                    {centre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee Table */}
        <EmployeeTable
          data={employeesData}
          isLoading={isLoading}
          onSort={handleSort}
          sortConfig={sortConfig}
          pagination={pagination}
          onPaginationChange={setPagination}
          isAdmin={isAdmin}
        />
      </Card>
    </div>
  );
}
