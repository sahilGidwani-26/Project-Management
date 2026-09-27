import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Workspace } from "@/types";

/** Landing point for /app — redirects to the user's first workspace or onboarding. */
export default function WorkspaceIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await api.get("/workspaces");
      const workspaces = res.data.data as Workspace[];
      if (workspaces.length > 0) {
        navigate(`/app/${workspaces[0]._id}/dashboard`, { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
