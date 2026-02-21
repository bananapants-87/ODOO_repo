import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFleet } from "@/lib/fleet-store";
import {
  LayoutDashboard, Truck, Route, Users, Wrench, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";

const navItems = [
  { label: "Command Center", path: "/dashboard", icon: LayoutDashboard },
  { label: "Vehicle Registry", path: "/vehicles", icon: Truck },
  { label: "Trip Dispatcher", path: "/trips", icon: Route },
  { label: "Driver Profiles", path: "/drivers", icon: Users },
  { label: "Maintenance", path: "/maintenance", icon: Wrench },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useFleet();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )} style={{ background: "var(--gradient-sidebar)" }}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-base font-bold text-foreground tracking-tight">FleetFlow</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {!collapsed && currentUser && (
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
