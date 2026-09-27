import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types";
import { formatDateTime, cn } from "@/lib/utils";
import { CheckCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications?limit=15")).data.data as NotificationItem[],
  });

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("notif-panel");
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div id="notif-panel" className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-semibold">Notifications</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {!data?.length && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-6 w-6" />
            <p className="text-sm">You're all caught up</p>
          </div>
        )}
        {data?.map((n) => (
          <div
            key={n._id}
            className={cn("border-b border-border px-3 py-2.5 last:border-0", !n.isRead && "bg-primary/5")}
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
