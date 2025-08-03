import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BillingSummary from "@/components/billing/billing-summary";

export default function Billing() {
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["/api/employees", { status: "active", limit: 1000 }],
    queryFn: async () => {
      const response = await fetch('/api/employees?status=active&limit=1000');
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
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

      {/* Detailed Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Band</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>SOW ID</TableHead>
                  <TableHead>Monthly Billing</TableHead>
                  <TableHead>Shift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees
                  .filter(emp => parseFloat(emp.appxBilling?.toString() || '0') > 0)
                  .sort((a, b) => parseFloat(b.appxBilling?.toString() || '0') - parseFloat(a.appxBilling?.toString() || '0'))
                  .slice(0, 20)
                  .map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.band}</TableCell>
                      <TableCell>${employee.rate}</TableCell>
                      <TableCell>{employee.sowId}</TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(employee.appxBilling?.toString() || '0').toLocaleString()}
                      </TableCell>
                      <TableCell>{employee.shift}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
