import { useParams, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { cn } from "@/lib/utils";

interface ProjectHealth {
  state: "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK";
  reasons: string[];
}

const tabs = [
  { to: "board", label: "Board" },
  { to: "list", label: "List" },
];

const healthConfig = {
  ON_TRACK: { label: "On track", icon: CheckCircle2, cls: "text-success" },
  NEEDS_ATTENTION: { label: "Needs attention", icon: AlertCircle, cls: "text-warning" },
  AT_RISK: { label: "At risk", icon: AlertTriangle, cls: "text-destructive" },
};

export default function ProjectLayout() {
  const { workspaceId, projectId } = useParams();

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}`)).data.data,
    enabled: !!projectId,
  });

  const { data: health } = useQuery({
    queryKey: ["project-health", projectId],
    queryFn: async () => (await api.get(`/analytics/project/${projectId}/health`)).data.data as ProjectHealth,
    enabled: !!projectId,
  });

  const project = projectData?.project;
  const hc = health ? healthConfig[health.state] : null;

  return (
    <div>
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{project?.name || "Loading..."}</h1>
              {project && <PriorityBadge priority={project.priority} />}
            </div>
            {project?.description && <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>}
          </div>

          {hc && (
            <div className="flex items-center gap-1.5" title={health!.reasons.join(", ")}>
              <hc.icon className={cn("h-4 w-4", hc.cls)} />
              <span className={cn("text-sm font-medium", hc.cls)}>{hc.label}</span>
            </div>
          )}
        </div>

        {health && health.reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {health.reasons.map((r) => (
              <span key={r} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {r}
              </span>
            ))}
          </div>
        )}

        <nav className="mt-4 flex gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={`/app/${workspaceId}/projects/${projectId}/${t.to}`}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
