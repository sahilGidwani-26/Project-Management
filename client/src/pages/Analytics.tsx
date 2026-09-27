import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

const COLORS = ["#0f766e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

const ranges = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
];

export default function Analytics() {
  const { workspaceId } = useParams();
  const [range, setRange] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-analytics-full", workspaceId, range],
    queryFn: async () =>
      (await api.get(`/analytics/workspace/${workspaceId}${range ? `?range=${range}` : ""}`)).data.data,
    enabled: !!workspaceId,
  });

  const { data: workload } = useQuery({
    queryKey: ["workload", workspaceId],
    queryFn: async () => (await api.get(`/analytics/workspace/${workspaceId}/workload`)).data.data,
    enabled: !!workspaceId,
  });

  const pieData = (data?.tasksByStatus || []).map((s: any) => ({ name: s._id, value: s.count }));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Team performance and project insights"
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ranges.map((r) => <SelectItem key={r.value} value={r.value || "all"}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tasks by status</CardTitle></CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Team workload</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!workload?.length && <p className="text-sm text-muted-foreground">No active assignments.</p>}
            {workload?.map((w: any) => (
              <div key={w._id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={w.user.profileImage} />
                      <AvatarFallback className="text-[10px]">{initials(w.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{w.user.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{w.assignedTasks} tasks</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, w.assignedTasks * 12)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
