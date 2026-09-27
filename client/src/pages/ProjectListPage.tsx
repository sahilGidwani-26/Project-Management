import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task } from "@/types";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate, initials, cn, isOverdue } from "@/lib/utils";
import { ListChecks } from "lucide-react";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";

export default function ProjectListPage() {
  const { projectId } = useParams();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => (await api.get(`/tasks?projectId=${projectId}&limit=200&sort=created`)).data.data as Task[],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <div className="p-6">
        <EmptyState icon={ListChecks} title="No tasks yet" description="Add tasks from the Board view to see them here." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Task</th>
              <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
              <th className="px-4 py-2.5 text-left font-medium">Priority</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Due date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((t) => (
              <tr key={t._id} className="cursor-pointer hover:bg-secondary/30" onClick={() => setSelectedTask(t)}>
                <td className="px-4 py-2.5 font-medium">{t.title}</td>
                <td className="px-4 py-2.5">
                  {t.assigneeId ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={t.assigneeId.profileImage} />
                        <AvatarFallback className="text-[9px]">{initials(t.assigneeId.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{t.assigneeId.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className={cn("px-4 py-2.5 text-xs", isOverdue(t.dueDate) && t.status !== "Done" && "text-destructive font-medium")}>
                  {t.dueDate ? formatDate(t.dueDate) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(v) => !v && setSelectedTask(null)} />
      )}
    </div>
  );
}
