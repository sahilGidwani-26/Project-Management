import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderKanban, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Project } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusDot: Record<string, string> = {
  Planning: "bg-slate-400",
  Active: "bg-emerald-500",
  "On Hold": "bg-amber-500",
  Completed: "bg-blue-500",
  Archived: "bg-slate-300",
};

export default function Projects() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => (await api.get(`/projects/workspace/${workspaceId}?limit=50`)).data.data as Project[],
    enabled: !!workspaceId,
  });

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/projects", { workspaceId, name, description, priority: "Medium" });
      qc.invalidateQueries({ queryKey: ["projects", workspaceId] });
      setOpen(false);
      setName("");
      setDescription("");
      toast.success("Project created");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Everything your team is working on"
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="p-6">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {!isLoading && !data?.length && (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing tasks with your team."
            actionLabel="New project"
            onAction={() => setOpen(true)}
          />
        )}

        {!!data?.length && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <Card
                key={p._id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/app/${workspaceId}/projects/${p._id}/board`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusDot[p.status]}`} />
                      <span className="text-xs text-muted-foreground">{p.status}</span>
                    </div>
                    <PriorityBadge priority={p.priority} />
                  </div>
                  <h3 className="mt-3 font-semibold">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description || "No description"}</p>
                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{p.progress}% complete</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <form onSubmit={createProject} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Project name</Label>
              <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Redesign" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || !name}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
