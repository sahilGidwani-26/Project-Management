import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";
import { User } from "@/types";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    const token = localStorage.getItem("pm_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
      getSocket();
    } catch {
      localStorage.removeItem("pm_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("pm_token", res.data.data.token);
    setUser(res.data.data.user);
    getSocket();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("pm_token", res.data.data.token);
    setUser(res.data.data.user);
    getSocket();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      toast.error(apiError(err));
    }
    localStorage.removeItem("pm_token");
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
