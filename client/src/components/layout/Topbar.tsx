import { useState } from "react";
import { Search, Bell, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { NotificationPanel } from "@/components/common/NotificationPanel";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const { user, logout } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, tasks, members..."
          className="pl-8 bg-secondary/60 border-transparent focus-visible:bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && workspaceId) {
              navigate(`/app/${workspaceId}/search?q=${encodeURIComponent(e.currentTarget.value)}`);
            }
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen((v) => !v)}>
            <Bell className="h-4 w-4" />
          </Button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback>{initials(user?.name)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/app/${workspaceId}/settings`)}>
              <UserIcon className="h-4 w-4" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
