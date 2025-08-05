import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, X, Filter } from "lucide-react";
import BillingSummary from "@/components/billing/billing-summary";

export default function Billing() {
  const [filters, setFilters] = useState({
    search: "",
    team: "all",
    status: "all", 
    role: "all",
    costCentre: "all",
    rateRange: "all"
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
  });
  
  const [sortConfig, setSortConfig] = useState({
    sortBy: "appxBilling",
    sortOrder: "desc" as "asc" | "desc",
  });

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

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/config/teams"],
  });

  const { data: costCentres = [] } = useQuery<any[]>({
    queryKey: ["/api/config/cost-centres"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const employees = employeesData?.employees || [];
  
  // Calculate billing summaries
  const totalBilling = employees.reduce((sum, emp) => sum + (parseFloat(emp.appxBilling?.toString() || '0')), 0);
  const averageRate = employees.length > 0 
    ? employees.reduce((sum, emp) => sum + (parseFloat(emp.rate?.toString() || '0')), 0) / employees.length 
    : 0;

  // Group by rate ranges
  const rateDistribution = {
    low: employees.filter(emp => parseFloat(emp.rate?.toString() || '0') <= 35).length,
    medium: employees.filter(emp => {
      const rate = parseFloat(emp.rate?.toString() || '0');
      return rate > 35 && rate <= 45;
    }).length,
    high: employees.filter(emp => parseFloat(emp.rate?.toString() || '0') > 45).length,
  };

  // Helper functions
  const handleSort = (column: string) => {
    setSortConfig(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      team: "all",
      status: "all",
      role: "all", 
      costCentre: "all",
      rateRange: "all"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'search' && value !== 'all'
    ).length + (filters.search ? 1 : 0);
  };

  const hasActiveFilters = () => getActiveFilterCount() > 0;

  const filteredEmployees = employees.filter(emp => {
    if (filters.rateRange !== 'all') {
      const rate = parseFloat(emp.rate?.toString() || '0');
      if (filters.rateRange === 'low' && rate > 35) return false;
      if (filters.rateRange === 'medium' && (rate <= 35 || rate > 45)) return false;
      if (filters.rateRange === 'high' && rate <= 45) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
        <p className="text-gray-600">Monitor billing information and financial analytics</p>
      </div>

      {/* Billing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Billing:</span>
                <span className="font-semibold">${totalBilling.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Employees:</span>
                <span className="font-semibold">{employees.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Rate:</span>
                <span className="font-semibold">${averageRate.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Annual Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Yearly Total:</span>
                <span className="font-semibold">${(totalBilling * 12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-semibold text-success">+12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency:</span>
                <span className="font-semibold">94.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">$25-35/hr</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(rateDistribution.low / employees.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{rateDistribution.low}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">$35-45/hr</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full"
                      style={{ width: `${(rateDistribution.medium / employees.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{rateDistribution.medium}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">$45+/hr</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full"
                      style={{ width: `${(rateDistribution.high / employees.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{rateDistribution.high}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()} active
                </Badge>
              )}
            </CardTitle>
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.team} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, team: value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team: any) => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.costCentre} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, costCentre: value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Cost Centre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Centres</SelectItem>
                {costCentres.map((centre: any) => (
                  <SelectItem key={centre.id} value={centre.code}>{centre.code} - {centre.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, status: value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.rateRange} onValueChange={(value) => {
              setFilters(prev => ({ ...prev, rateRange: value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Rate Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="low">$25-35/hr</SelectItem>
                <SelectItem value="medium">$35-45/hr</SelectItem>
                <SelectItem value="high">$45+/hr</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pagination.limit.toString()} onValueChange={(value) => {
              setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Per Page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Billing Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Billing Information</CardTitle>
            <div className="text-sm text-gray-600">
              Showing {employeesData?.employees?.length || 0} of {employeesData?.total || 0} employees
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("name")}
                  >
                    Employee {sortConfig.sortBy === "name" && (sortConfig.sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Cost Centre</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("rate")}
                  >
                    Rate {sortConfig.sortBy === "rate" && (sortConfig.sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>SOW ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("appxBilling")}
                  >
                    Monthly Billing {sortConfig.sortBy === "appxBilling" && (sortConfig.sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(pagination.limit)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No employees found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.team}</TableCell>
                      <TableCell>{employee.costCentre}</TableCell>
                      <TableCell>{employee.band}</TableCell>
                      <TableCell>${employee.rate}</TableCell>
                      <TableCell>{employee.sowId}</TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(employee.appxBilling?.toString() || '0').toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {employeesData?.totalPages && employeesData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {employeesData.page} of {employeesData.totalPages} 
                ({employeesData.total} total employees)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={employeesData.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, employeesData.totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(
                      employeesData.totalPages - 4,
                      employeesData.page - 2
                    )) + i;
                    return pageNumber <= employeesData.totalPages ? (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === employeesData.page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                      >
                        {pageNumber}
                      </Button>
                    ) : null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(employeesData.totalPages, prev.page + 1) }))}
                  disabled={employeesData.page >= employeesData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
