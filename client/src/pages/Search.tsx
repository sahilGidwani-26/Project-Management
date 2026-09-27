import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function SearchPage() {
  const [params] = useSearchParams();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", workspaceId, q],
    queryFn: async () => (await api.get(`/search/workspace/${workspaceId}?q=${encodeURIComponent(q)}`)).data.data,
    enabled: !!workspaceId && !!q,
  });

  return (
    <div>
      <PageHeader title={`Search results for "${q}"`} />
      <div className="p-6 space-y-6">
        {isLoading && <Skeleton className="h-40" />}

        {data && (
          <>
            <Card>
              <CardHeader><CardTitle>Projects ({data.projects.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.projects.map((p: any) => (
                  <div key={p._id} className="cursor-pointer rounded-md p-2 hover:bg-secondary" onClick={() => navigate(`/app/${workspaceId}/projects/${p._id}/board`)}>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                ))}
                {!data.projects.length && <p className="text-sm text-muted-foreground">No matching projects</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tasks ({data.tasks.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.tasks.map((t: any) => (
                  <div key={t._id} className="flex items-center justify-between rounded-md p-2 hover:bg-secondary">
                    <span className="text-sm font-medium">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
                {!data.tasks.length && <p className="text-sm text-muted-foreground">No matching tasks</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Members ({data.members.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.members.map((m: any) => (
                  <div key={m._id} className="text-sm">{m.userId?.name}</div>
                ))}
                {!data.members.length && <p className="text-sm text-muted-foreground">No matching members</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
