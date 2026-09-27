import { NavLink, useParams } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, MessageSquare, BarChart3, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "projects", label: "Projects", icon: FolderKanban },
  { to: "my-tasks", label: "My Tasks", icon: CheckSquare },
  { to: "chat", label: "Team Chat", icon: MessageSquare },
  { to: "analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { workspaceId } = useParams();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="absolute left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground p-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold">Menu</span>
          <button onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={`/app/${workspaceId}/${item.to}`}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
