import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings, 
  UserCog,
  Building2
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, roles: ["admin", "finance"] },
  { name: "Employees", href: "/employees", icon: Users, roles: ["admin", "finance"] },
  { name: "Billing", href: "/billing", icon: DollarSign, roles: ["admin", "finance"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "finance"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  { name: "User Management", href: "/users", icon: UserCog, roles: ["admin"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || "finance")
  );

  return (
    <div className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-primary text-white rounded-lg w-10 h-10 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Elixr Labs Billing System</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
                    isActive && "bg-primary text-white hover:bg-primary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
