import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Filter, Download, Clock, Edit, TrendingUp } from "lucide-react";
import type { Employee } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const { data: changeReports = [], isLoading } = useQuery<Employee[]>({
    queryKey: [`/api/reports/changes?period=${period}`],
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

  const stats = getPeriodStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Data Change Reports</h1>
          <p className="text-gray-600">Track and analyze employee data modifications</p>
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
                <Calendar className="w-5 h-5 text-purple-600" />
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
            <Edit className="w-5 h-5" />
            <span>Employee Data Changes - {period.charAt(0).toUpperCase() + period.slice(1)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                </div>
              ))}
            </div>
          ) : changeReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Edit className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No employee data changes found for the selected period</p>
              <p className="text-sm">Try selecting a different time period</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Changes Made</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeReports.map((employee) => (
                  <TableRow key={`${employee.id}-${employee.updatedAt}`}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(employee.updatedAt || employee.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(employee.updatedAt || employee.createdAt || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{employee.team || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {employee.changesSummary ? (
                          <div className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded">
                            {employee.changesSummary}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No changes recorded</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}