import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingSummaryProps {
  totalBilling: number;
  activeEmployees: number;
  averageRate: number;
}

export default function BillingSummary({ totalBilling, activeEmployees, averageRate }: BillingSummaryProps) {
  return (
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
              <span className="font-semibold">{activeEmployees}</span>
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
          <CardTitle>Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Offshore Rate:</span>
              <span className="font-semibold">${(averageRate * 0.8).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Onsite Rate:</span>
              <span className="font-semibold">${(averageRate * 1.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost Savings:</span>
              <span className="font-semibold text-success">15%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
