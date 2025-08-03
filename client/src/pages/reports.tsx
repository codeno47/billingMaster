import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Users, Download } from "lucide-react";

export default function Reports() {
  const handleDownloadReport = (reportType: string) => {
    // This would typically generate and download actual reports
    console.log(`Downloading ${reportType} report`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and download comprehensive reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary bg-opacity-10 rounded-lg p-3">
                <FileText className="text-primary text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Monthly Report</h3>
                <p className="text-sm text-gray-600">Employee billing summary</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDownloadReport('monthly')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-success bg-opacity-10 rounded-lg p-3">
                <TrendingUp className="text-success text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Trend Analysis</h3>
                <p className="text-sm text-gray-600">Billing trends over time</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDownloadReport('trends')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-warning bg-opacity-10 rounded-lg p-3">
                <Users className="text-warning text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Team Analysis</h3>
                <p className="text-sm text-gray-600">Performance by team</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleDownloadReport('teams')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Monthly Billing Report - July 2025</h4>
                <p className="text-sm text-gray-600">Generated on July 31, 2025</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Team Performance Report - Q2 2025</h4>
                <p className="text-sm text-gray-600">Generated on June 30, 2025</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
