import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminWorkspaces() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: async () => (await api.get("/admin/workspaces?limit=30")).data.data,
  });

  const toggleSuspend = async (id: string, suspended: boolean) => {
    await api.patch(`/admin/workspaces/${id}/${suspended ? "reactivate" : "suspend"}`);
    qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
    toast.success(suspended ? "Workspace reactivated" : "Workspace suspended");
  };

  return (
    <div>
      <PageHeader title="Workspaces" description="All workspaces on the platform" />
      <div className="p-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Slug</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Created</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.map((w: any) => (
                <tr key={w._id}>
                  <td className="px-4 py-2.5 font-medium">{w.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{w.slug}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={w.status === "active" ? "secondary" : "destructive"}>{w.status || "active"}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggleSuspend(w._id, w.status === "suspended")}>
                      {w.status === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
