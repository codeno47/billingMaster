import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Billing from "@/pages/billing";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

function AuthenticatedLayout() {
  const [location] = useLocation();

  const renderPage = () => {
    switch (location) {
      case '/':
        return <Dashboard />;
      case '/employees':
        return <Employees />;
      case '/billing':
        return <Billing />;
      case '/reports':
        return <Reports />;
      case '/settings':
        return <Settings />;
      case '/users':
        return <UserManagement />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
