import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/common/protected-route";

function UserManagementContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage system users and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            View and manage all users with access to the billing system. Control roles and permissions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Configure user roles and their associated permissions within the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserManagement() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserManagementContent />
    </ProtectedRoute>
  );
}
