import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Workspace } from "@/types";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const { workspaceId } = useParams();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/workspaces");
      setWorkspaces(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const currentWorkspace = workspaces.find((w) => w._id === workspaceId) || null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, currentWorkspace, loading, refetch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

/** Redirects to the first available workspace, or /onboarding if none exist. */
export function useDefaultWorkspaceRedirect() {
  const { workspaces, loading } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && workspaces.length > 0) {
      navigate(`/app/${workspaces[0]._id}/dashboard`, { replace: true });
    } else if (!loading && workspaces.length === 0) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, workspaces, navigate]);
}
