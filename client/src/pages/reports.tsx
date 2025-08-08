import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Filter, Download, Clock, Edit, TrendingUp, Building2, DollarSign, BarChart3, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { Employee } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveSparkline } from "@/components/SparklineChart";

type CostCentreBilling = {
  costCentre: string;
  totalBilling: number;
  employeeCount: number;
  averageRate: number;
};

type PerformanceData = {
  costCentre: string;
  monthlyData: {
    month: string;
    billing: number;
    employees: number;
    averageRate: number;
  }[];
};

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('changes');
  
  // Changes report filters and pagination
  const [changesFilters, setChangesFilters] = useState({
    search: "",
    team: "all",
    status: "all",
  });
  
  const [changesPagination, setChangesPagination] = useState({
    page: 1,
    limit: 25,
  });
  
  const [changesSortConfig, setChangesSortConfig] = useState({
    sortBy: "updatedAt",
    sortOrder: "desc" as "asc" | "desc",
  });
  
  // Billing report filters and pagination
  const [billingFilters, setBillingFilters] = useState({
    search: "",
  });
  
  const [billingPagination, setBillingPagination] = useState({
    page: 1,
    limit: 25,
  });
  
  const [billingSortConfig, setBillingSortConfig] = useState({
    sortBy: "totalBilling",
    sortOrder: "desc" as "asc" | "desc",
  });
  
  const { data: changeReportsData, isLoading: isLoadingChanges } = useQuery({
    queryKey: ["/api/reports/changes", period, changesFilters, changesPagination, changesSortConfig],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        ...changesFilters,
        page: changesPagination.page.toString(),
        limit: changesPagination.limit.toString(),
        sortBy: changesSortConfig.sortBy,
        sortOrder: changesSortConfig.sortOrder,
      });
      
      const response = await fetch(`/api/reports/changes?${params}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: costCentreBillingData, isLoading: isLoadingBilling } = useQuery({
    queryKey: ["/api/reports/cost-centre-billing", billingFilters, billingPagination, billingSortConfig],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...billingFilters,
        page: billingPagination.page.toString(),
        limit: billingPagination.limit.toString(),
        sortBy: billingSortConfig.sortBy,
        sortOrder: billingSortConfig.sortOrder,
      });
      
      const response = await fetch(`/api/reports/cost-centre-billing?${params}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
  });

  const { data: performanceData = [], isLoading: isLoadingPerformance } = useQuery<PerformanceData[]>({
    queryKey: ['/api/reports/cost-centre-performance'],
  });

  const changeReports = changeReportsData?.reports || [];
  const costCentreBilling = costCentreBillingData?.billing || [];

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/config/teams"],
  });

  const handleDownloadReport = () => {
    if (!changeReports.length) return;
    
    // Create CSV content
    const headers = ['Date', 'Employee Name', 'Team', 'Status', 'Changes Made'];
    const csvData = changeReports.map(emp => [
      new Date(emp.updatedAt || emp.createdAt || Date.now()).toLocaleDateString(),
      emp.name,
      emp.team || 'N/A',
      emp.status,
      emp.changesSummary || 'No changes recorded'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-changes-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadBillingReport = () => {
    if (!costCentreBilling.length) return;
    
    // Calculate total billing for percentage calculations
    const totalBilling = costCentreBillingData?.totalBilling || 0;
    
    // Create CSV content with billing percentage
    const headers = ['Cost Centre', 'Total Monthly Billing ($)', 'Active Employees', 'Average Rate ($)', 'Billing Percentage (%)'];
    const csvData = costCentreBilling.map(cc => {
      // Calculate billing percentage for each cost centre
      const billingPercentage = totalBilling > 0 
        ? (cc.totalBilling / totalBilling * 100) 
        : 0;
      
      return [
        cc.costCentre,
        cc.totalBilling.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        cc.employeeCount.toString(),
        cc.averageRate.toFixed(2),
        billingPercentage.toFixed(1)
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-centre-billing-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper functions for changes tab
  const handleChangesSort = (column: string) => {
    setChangesSortConfig(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
    setChangesPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetChangesFilters = () => {
    setChangesFilters({
      search: "",
      team: "all",
      status: "all",
    });
    setChangesPagination(prev => ({ ...prev, page: 1 }));
  };

  const getChangesActiveFilterCount = () => {
    return Object.entries(changesFilters).filter(([key, value]) => 
      key !== 'search' && value !== 'all'
    ).length + (changesFilters.search ? 1 : 0);
  };

  const hasChangesActiveFilters = () => getChangesActiveFilterCount() > 0;

  // Helper functions for billing tab
  const handleBillingSort = (column: string) => {
    setBillingSortConfig(prev => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
    setBillingPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetBillingFilters = () => {
    setBillingFilters({
      search: "",
    });
    setBillingPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasBillingActiveFilters = () => billingFilters.search.length > 0;

  const getPeriodStats = () => {
    const totalChanges = changeReportsData?.total || 0;
    const uniqueEmployees = new Set(changeReports.map(emp => emp.id)).size;
    const statusChanges = changeReports.filter(emp => 
      emp.changesSummary?.includes('Status:')
    ).length;
    const rateChanges = changeReports.filter(emp => 
      emp.changesSummary?.includes('Rate:')
    ).length;
    
    return { totalChanges, uniqueEmployees, statusChanges, rateChanges };
  };

  const getBillingStats = () => {
    const totalBilling = costCentreBillingData?.totalBilling || 0;
    const totalEmployees = costCentreBillingData?.totalEmployees || 0;
    const averagePerCentre = costCentreBilling.length > 0 ? totalBilling / costCentreBilling.length : 0;
    
    return { totalBilling, totalEmployees, averagePerCentre, centreCount: costCentreBilling.length };
  };

  const stats = getPeriodStats();
  const billingStats = getBillingStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Employee change tracking and billing analysis</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changes" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Change Reports</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Cost Centre Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Employee Data Changes</h2>
              <p className="text-gray-600">Track employee data modifications over time</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={period} onValueChange={(value: 'week' | 'month' | 'year') => setPeriod(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleDownloadReport} disabled={!changeReports.length}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters Section for Changes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                  {hasChangesActiveFilters() && (
                    <Badge variant="secondary" className="ml-2">
                      {getChangesActiveFilterCount()} active
                    </Badge>
                  )}
                </CardTitle>
                {hasChangesActiveFilters() && (
                  <Button variant="outline" size="sm" onClick={resetChangesFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={changesFilters.search}
                    onChange={(e) => {
                      setChangesFilters(prev => ({ ...prev, search: e.target.value }));
                      setChangesPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="pl-10"
                  />
                </div>
                
                <Select value={changesFilters.team} onValueChange={(value) => {
                  setChangesFilters(prev => ({ ...prev, team: value }));
                  setChangesPagination(prev => ({ ...prev, page: 1 }));
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

                <Select value={changesFilters.status} onValueChange={(value) => {
                  setChangesFilters(prev => ({ ...prev, status: value }));
                  setChangesPagination(prev => ({ ...prev, page: 1 }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={changesPagination.limit.toString()} onValueChange={(value) => {
                  setChangesPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
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

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Edit className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Changes</p>
                    <p className="text-xl font-bold">{stats.totalChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees Modified</p>
                    <p className="text-xl font-bold">{stats.uniqueEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-lg p-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status Changes</p>
                    <p className="text-xl font-bold">{stats.statusChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 rounded-lg p-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rate Changes</p>
                    <p className="text-xl font-bold">{stats.rateChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Changes Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Recent Changes ({period})</span>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Showing {changeReports.length} of {changeReportsData?.total || 0} changes
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingChanges ? (
                <div className="text-center py-8">Loading changes...</div>
              ) : changeReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employee changes found for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleChangesSort("updatedAt")}
                        >
                          Date {changesSortConfig.sortBy === "updatedAt" && (changesSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleChangesSort("name")}
                        >
                          Employee {changesSortConfig.sortBy === "name" && (changesSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Changes Made</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeReports.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            {new Date(employee.updatedAt || employee.createdAt || Date.now()).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.team || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={employee.status === 'active' ? 'default' : 
                                      employee.status === 'deleted' ? 'destructive' : 'secondary'}
                            >
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm text-gray-600">
                              {employee.changesSummary || 'No changes recorded'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination for Changes */}
              {changeReportsData?.totalPages && changeReportsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {changeReportsData.page} of {changeReportsData.totalPages} 
                    ({changeReportsData.total} total changes)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangesPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={changeReportsData.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, changeReportsData.totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(
                          changeReportsData.totalPages - 4,
                          changeReportsData.page - 2
                        )) + i;
                        return pageNumber <= changeReportsData.totalPages ? (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === changeReportsData.page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setChangesPagination(prev => ({ ...prev, page: pageNumber }))}
                          >
                            {pageNumber}
                          </Button>
                        ) : null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChangesPagination(prev => ({ ...prev, page: Math.min(changeReportsData.totalPages, prev.page + 1) }))}
                      disabled={changeReportsData.page >= changeReportsData.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Monthly Billing by Cost Centre</h2>
              <p className="text-gray-600">Analyze monthly billing distribution across cost centres</p>
            </div>
            
            <Button onClick={handleDownloadBillingReport} disabled={!costCentreBilling.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters Section for Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                  {hasBillingActiveFilters() && (
                    <Badge variant="secondary" className="ml-2">
                      1 active
                    </Badge>
                  )}
                </CardTitle>
                {hasBillingActiveFilters() && (
                  <Button variant="outline" size="sm" onClick={resetBillingFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cost centres..."
                    value={billingFilters.search}
                    onChange={(e) => {
                      setBillingFilters(prev => ({ ...prev, search: e.target.value }));
                      setBillingPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="pl-10"
                  />
                </div>

                <Select value={billingPagination.limit.toString()} onValueChange={(value) => {
                  setBillingPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }));
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

          {/* Billing Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 rounded-lg p-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Monthly Billing</p>
                    <p className="text-xl font-bold">${billingStats.totalBilling.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cost Centres</p>
                    <p className="text-xl font-bold">{billingStats.centreCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Active Employees</p>
                    <p className="text-xl font-bold">{billingStats.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-lg p-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average per Centre</p>
                    <p className="text-xl font-bold">${billingStats.averagePerCentre.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Sparklines - Temporarily disabled for debugging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Interactive sparkline charts coming soon...
              </div>
            </CardContent>
          </Card>

          {/* Billing Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Cost Centre Billing Breakdown</span>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Showing {costCentreBilling.length} of {costCentreBillingData?.total || 0} cost centres
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingBilling ? (
                <div className="text-center py-8">Loading billing data...</div>
              ) : costCentreBilling.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No billing data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleBillingSort("costCentre")}
                        >
                          Cost Centre {billingSortConfig.sortBy === "costCentre" && (billingSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-50"
                          onClick={() => handleBillingSort("totalBilling")}
                        >
                          Monthly Billing {billingSortConfig.sortBy === "totalBilling" && (billingSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-50"
                          onClick={() => handleBillingSort("employeeCount")}
                        >
                          Active Employees {billingSortConfig.sortBy === "employeeCount" && (billingSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-gray-50"
                          onClick={() => handleBillingSort("averageRate")}
                        >
                          Average Rate {billingSortConfig.sortBy === "averageRate" && (billingSortConfig.sortOrder === "asc" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead className="text-right">Billing %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costCentreBilling.map((centre) => {
                        const billingPercentage = billingStats.totalBilling > 0 
                          ? (centre.totalBilling / billingStats.totalBilling * 100) 
                          : 0;
                        
                        return (
                          <TableRow key={centre.costCentre}>
                            <TableCell className="font-medium">
                              <Badge variant="outline">{centre.costCentre}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${centre.totalBilling.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">{centre.employeeCount}</TableCell>
                            <TableCell className="text-right">
                              ${centre.averageRate.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={billingPercentage >= 40 ? 'default' : billingPercentage >= 20 ? 'secondary' : 'outline'}>
                                {billingPercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination for Billing */}
              {costCentreBillingData?.totalPages && costCentreBillingData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {costCentreBillingData.page} of {costCentreBillingData.totalPages} 
                    ({costCentreBillingData.total} total cost centres)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBillingPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={costCentreBillingData.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, costCentreBillingData.totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(
                          costCentreBillingData.totalPages - 4,
                          costCentreBillingData.page - 2
                        )) + i;
                        return pageNumber <= costCentreBillingData.totalPages ? (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === costCentreBillingData.page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setBillingPagination(prev => ({ ...prev, page: pageNumber }))}
                          >
                            {pageNumber}
                          </Button>
                        ) : null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBillingPagination(prev => ({ ...prev, page: Math.min(costCentreBillingData.totalPages, prev.page + 1) }))}
                      disabled={costCentreBillingData.page >= costCentreBillingData.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}