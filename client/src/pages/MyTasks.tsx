import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { CheckSquare } from "lucide-react";
import { cn, formatDate, isOverdue } from "@/lib/utils";

export default function MyTasks() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my-tasks", user?._id],
    queryFn: async () => (await api.get(`/tasks?assigneeId=${user?._id}&limit=100&sort=dueDate`)).data.data as Task[],
    enabled: !!user,
  });

  return (
    <div>
      <PageHeader title="My Tasks" description="Everything assigned to you, across every project" />
      <div className="p-6">
        {isLoading && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}

        {!isLoading && !tasks?.length && (
          <EmptyState icon={CheckSquare} title="Nothing assigned to you" description="Tasks assigned to you across all projects will show up here." />
        )}

        {!!tasks?.length && (
          <div className="space-y-2">
            {tasks.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelectedTask(t)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-shadow hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.dueDate && (
                    <p className={cn("mt-0.5 text-xs text-muted-foreground", isOverdue(t.dueDate) && t.status !== "Done" && "text-destructive font-medium")}>
                      Due {formatDate(t.dueDate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(v) => !v && setSelectedTask(null)} />
      )}
    </div>
  );
}
