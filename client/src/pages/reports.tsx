import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Filter, Download, Clock, Edit, TrendingUp, Building2, DollarSign, BarChart3 } from "lucide-react";
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
  
  const { data: changeReports = [], isLoading: isLoadingChanges } = useQuery<Employee[]>({
    queryKey: [`/api/reports/changes?period=${period}`],
  });

  const { data: costCentreBilling = [], isLoading: isLoadingBilling } = useQuery<CostCentreBilling[]>({
    queryKey: ['/api/reports/cost-centre-billing'],
  });

  const { data: performanceData = [], isLoading: isLoadingPerformance } = useQuery<PerformanceData[]>({
    queryKey: ['/api/reports/cost-centre-performance'],
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
    
    // Create CSV content
    const headers = ['Cost Centre', 'Total Monthly Billing ($)', 'Active Employees', 'Average Rate ($)'];
    const csvData = costCentreBilling.map(cc => [
      cc.costCentre,
      cc.totalBilling.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cc.employeeCount.toString(),
      cc.averageRate.toFixed(2)
    ]);
    
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

  const getPeriodStats = () => {
    const totalChanges = changeReports.length;
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
    const totalBilling = costCentreBilling.reduce((sum, cc) => sum + cc.totalBilling, 0);
    const totalEmployees = costCentreBilling.reduce((sum, cc) => sum + cc.employeeCount, 0);
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
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Changes ({period})</span>
              </CardTitle>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
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
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Cost Centre Billing Breakdown</span>
              </CardTitle>
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
                        <TableHead>Cost Centre</TableHead>
                        <TableHead className="text-right">Monthly Billing</TableHead>
                        <TableHead className="text-right">Active Employees</TableHead>
                        <TableHead className="text-right">Average Rate</TableHead>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}