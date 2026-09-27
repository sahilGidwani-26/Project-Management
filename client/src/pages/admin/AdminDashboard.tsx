import { useQuery } from "@tanstack/react-query";
import { Users, Building2, FolderKanban, CheckSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

const statConfig = [
  { key: "totalUsers", label: "Total Users", icon: Users },
  { key: "totalWorkspaces", label: "Total Workspaces", icon: Building2 },
  { key: "totalProjects", label: "Total Projects", icon: FolderKanban },
  { key: "tasksCompleted", label: "Tasks Completed", icon: CheckSquare },
] as const;

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => (await api.get("/admin/dashboard")).data.data,
  });

  return (
    <div>
      <PageHeader title="Platform Admin" description="Overview across every workspace" />
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((s) => (
          <Card key={s.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-2xl font-semibold">{data?.[s.key] ?? 0}</p>}
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
