import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Building2, ScrollText, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-60 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4">
          <button onClick={() => navigate("/app")} className="flex items-center gap-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </button>
          <p className="mt-3 text-sm font-semibold">Platform Admin</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end border-b border-border px-4">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
