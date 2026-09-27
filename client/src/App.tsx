import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, AdminRoute } from "@/routes/ProtectedRoute";
import WorkspaceIndex from "@/routes/WorkspaceIndex";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectLayout from "@/pages/ProjectLayout";
import ProjectBoardPage from "@/pages/ProjectBoardPage";
import ProjectListPage from "@/pages/ProjectListPage";
import MyTasks from "@/pages/MyTasks";
import Chat from "@/pages/Chat";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import SearchPage from "@/pages/Search";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminWorkspaces from "@/pages/admin/AdminWorkspaces";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/app" element={<WorkspaceIndex />} />

                <Route path="/app/:workspaceId" element={<AppLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId" element={<ProjectLayout />}>
                    <Route index element={<Navigate to="board" replace />} />
                    <Route path="board" element={<ProjectBoardPage />} />
                    <Route path="list" element={<ProjectListPage />} />
                  </Route>
                  <Route path="my-tasks" element={<MyTasks />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="search" element={<SearchPage />} />
                </Route>
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="workspaces" element={<AdminWorkspaces />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
