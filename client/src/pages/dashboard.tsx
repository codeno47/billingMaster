import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Building, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  total: string | number;
  active: string | number;
  inactive: string | number;
  monthlyBilling: string | number;
  averageRate: string | number;
  teamDistribution?: { team: string; count: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Administrator Dashboard' : 'Finance Manager Dashboard'}
        </h1>
        <p className="text-gray-600">Overview of employee billing and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{Number(stats?.total) || 0}</p>
                <p className="text-sm text-success mt-1">
                  {Number(stats?.active) || 0} Active
                </p>
              </div>
              <div className="bg-primary bg-opacity-10 rounded-lg p-3">
                <Users className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Billing</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(Number(stats?.monthlyBilling) || 0).toLocaleString()}
                </p>
                <p className="text-sm text-success mt-1">
                  +12% this month
                </p>
              </div>
              <div className="bg-success bg-opacity-10 rounded-lg p-3">
                <DollarSign className="text-success text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(Number(stats?.averageRate) || 0).toFixed(2)}
                </p>
                <p className="text-sm text-warning mt-1">
                  Per hour
                </p>
              </div>
              <div className="bg-warning bg-opacity-10 rounded-lg p-3">
                <TrendingUp className="text-warning text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Teams</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.teamDistribution?.length || 0}
                </p>
                <p className="text-sm text-primary mt-1">
                  All Active
                </p>
              </div>
              <div className="bg-blue-500 bg-opacity-10 rounded-lg p-3">
                <Building className="text-blue-500 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.teamDistribution?.slice(0, 5).map((team, index) => (
                <div key={team.team} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{team.team}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-success' :
                          index === 2 ? 'bg-warning' :
                          'bg-gray-400'
                        }`}
                        style={{ 
                          width: `${Math.min((team.count / (Number(stats?.active) || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{team.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <p className="text-sm text-gray-600">System initialized successfully</p>
                <span className="text-xs text-gray-400">Just now</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-sm text-gray-600">Dashboard loaded</p>
                <span className="text-xs text-gray-400">1 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
