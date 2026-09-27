import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronsUpDown,
  Plus,
  Shield,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "projects", label: "Projects", icon: FolderKanban },
  { to: "my-tasks", label: "My Tasks", icon: CheckSquare },
  { to: "chat", label: "Team Chat", icon: MessageSquare },
  { to: "analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const { workspaceId } = useParams();
  const { workspaces, currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              {currentWorkspace?.name?.[0]?.toUpperCase() || "F"}
            </div>
            <span className="flex-1 truncate text-left text-sm font-semibold">
              {currentWorkspace?.name || "Flowbase"}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((w) => (
              <DropdownMenuItem key={w._id} onClick={() => navigate(`/app/${w._id}/dashboard`)}>
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                  {w.name[0]?.toUpperCase()}
                </div>
                {w.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/onboarding")}>
              <Plus className="h-4 w-4" /> New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={`/app/${workspaceId}/${item.to}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        {user?.isSuperAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Shield className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to={`/app/${workspaceId}/settings`}
          className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent transition-colors"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback>{initials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          </div>
          <Settings className="h-4 w-4 opacity-60" />
        </NavLink>
      </div>
    </aside>
  );
}
