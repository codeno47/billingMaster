import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/common/protected-route";

function SettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and billing rates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Configure billing rates, currency settings, and calculation methods.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Adjust system-wide settings including notifications, data retention, and export formats.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute requiredRole="admin">
      <SettingsContent />
    </ProtectedRoute>
  );
}
