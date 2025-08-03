import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, Eye, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import EmployeeForm from "./employee-form";
import type { Employee } from "@shared/schema";

interface EmployeeTableProps {
  data: {
    employees: Employee[];
    total: number;
    page: number;
    totalPages: number;
  } | undefined;
  isLoading: boolean;
  onSort: (column: string) => void;
  sortConfig: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  pagination: {
    page: number;
    limit: number;
  };
  onPaginationChange: (pagination: { page: number; limit: number }) => void;
  isAdmin: boolean;
}

export default function EmployeeTable({
  data,
  isLoading,
  onSort,
  sortConfig,
  pagination,
  onPaginationChange,
  isAdmin,
}: EmployeeTableProps) {
  const { toast } = useToast();
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employee deleted",
        description: "Employee has been successfully deleted",
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
        description: "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortConfig.sortBy !== column) return null;
    return sortConfig.sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("role")}
              >
                <div className="flex items-center space-x-1">
                  <span>Role</span>
                  {getSortIcon("role")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("team")}
              >
                <div className="flex items-center space-x-1">
                  <span>Team</span>
                  {getSortIcon("team")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("rate")}
              >
                <div className="flex items-center space-x-1">
                  <span>Rate</span>
                  {getSortIcon("rate")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("status")}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("startDate")}
              >
                <div className="flex items-center space-x-1">
                  <span>Start Date</span>
                  {getSortIcon("startDate")}
                </div>
              </TableHead>
              <TableHead>End Date</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("appxBilling")}
              >
                <div className="flex items-center space-x-1">
                  <span>Billing</span>
                  {getSortIcon("appxBilling")}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.employees.map((employee) => (
              <TableRow key={employee.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className={employee.status === 'active' ? 'bg-primary text-white' : 'bg-gray-400 text-white'}>
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.cId || 'No ID'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-900">{employee.role}</TableCell>
                <TableCell className="text-gray-900">{employee.team}</TableCell>
                <TableCell className="text-gray-900">${employee.rate}</TableCell>
                <TableCell>
                  <Badge 
                    variant={employee.status === 'active' ? 'default' : 'secondary'}
                    className={employee.status === 'active' ? 'bg-success text-white' : 'bg-gray-400 text-white'}
                  >
                    {employee.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {employee.startDate || 'Not set'}
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {employee.endDate || 'Active'}
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  ${employee.appxBilling?.toLocaleString() || '0.00'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewEmployee(employee)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => setEditEmployee(employee)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {((data.page - 1) * pagination.limit) + 1} to {Math.min(data.page * pagination.limit, data.total)} of {data.total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ ...pagination, page: pagination.page - 1 })}
              disabled={data.page <= 1}
            >
              Previous
            </Button>
            {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
              const page = Math.max(1, data.page - 2) + i;
              if (page > data.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === data.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPaginationChange({ ...pagination, page })}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange({ ...pagination, page: pagination.page + 1 })}
              disabled={data.page >= data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Employee Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{viewEmployee.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Employee ID</label>
                <p className="text-gray-900">{viewEmployee.cId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <p className="text-gray-900">{viewEmployee.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Team</label>
                <p className="text-gray-900">{viewEmployee.team}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rate</label>
                <p className="text-gray-900">${viewEmployee.rate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-gray-900">{viewEmployee.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Band</label>
                <p className="text-gray-900">{viewEmployee.band}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">SOW ID</label>
                <p className="text-gray-900">{viewEmployee.sowId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Monthly Billing</label>
                <p className="text-gray-900">${viewEmployee.appxBilling}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Shift</label>
                <p className="text-gray-900">{viewEmployee.shift}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Comments</label>
                <p className="text-gray-900">{viewEmployee.comments || 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editEmployee && (
            <EmployeeForm
              employee={editEmployee}
              onSuccess={() => setEditEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
