import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { formatDateTime } from "@/lib/utils";

export default function AdminAuditLogs() {
  const { data } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await api.get("/admin/audit-logs?limit=50")).data.data,
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="Platform-wide activity trail" />
      <div className="p-6 space-y-2">
        {data?.map((log: any) => (
          <div key={log._id} className="flex items-center justify-between rounded-md border border-border px-4 py-2.5 text-sm">
            <div>
              <span className="font-medium">{log.actorId?.name || "System"}</span>{" "}
              <span className="text-muted-foreground">{log.action.replace(/_/g, " ")}</span>{" "}
              <span className="text-muted-foreground">on {log.resourceType}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">No activity logged yet.</p>}
      </div>
    </div>
  );
}
