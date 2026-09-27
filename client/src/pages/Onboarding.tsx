import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Workflow, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/useWorkspace";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/workspaces", { name, description, slug: `${slugify(name)}-${Date.now().toString(36).slice(-4)}` });
      navigate(`/app/${res.data.data._id}/dashboard`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Workflow className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Create your workspace</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            A workspace holds your team, projects and tasks — like "My Startup" or "Freelance Work"
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="My Startup" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this workspace for?" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
