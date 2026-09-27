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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckSquare } from "lucide-react";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";

function TaskListSimple({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <button
          key={t._id}
          onClick={() => onSelect(t)}
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
            {!!t.assigneeIds?.length && (
              <div className="flex -space-x-2 mr-1">
                {t.assigneeIds.slice(0, 3).map((a) => (
                  <Avatar key={a._id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={a.profileImage} />
                    <AvatarFallback className="text-[9px]">{initials(a.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
            <PriorityBadge priority={t.priority} />
            <StatusBadge status={t.status} />
          </div>
        </button>
      ))}
    </div>
  );
}

export default function MyTasks() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: assignedToMe, isLoading: loadingAssigned } = useQuery({
    queryKey: ["my-tasks-assigned", user?._id],
    queryFn: async () => (await api.get(`/tasks?assigneeId=${user!._id}&limit=100&sort=dueDate`)).data.data as Task[],
    enabled: !!user?._id,
  });

  const { data: createdByMe, isLoading: loadingCreated } = useQuery({
    queryKey: ["my-tasks-created", user?._id],
    queryFn: async () => (await api.get(`/tasks?createdBy=${user!._id}&limit=100&sort=created`)).data.data as Task[],
    enabled: !!user?._id,
  });

  return (
    <div>
      <PageHeader title="My Tasks" description="Everything assigned to you, or that you've assigned to others" />
      <div className="p-6">
        <Tabs defaultValue="assigned">
          <TabsList>
            <TabsTrigger value="assigned">Assigned to me{assignedToMe?.length ? ` (${assignedToMe.length})` : ""}</TabsTrigger>
            <TabsTrigger value="created">Assigned by me{createdByMe?.length ? ` (${createdByMe.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            {loadingAssigned && <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
            {!loadingAssigned && !assignedToMe?.length && (
              <EmptyState icon={CheckSquare} title="Nothing assigned to you" description="Tasks assigned to you across all projects will show up here." />
            )}
            {!!assignedToMe?.length && <TaskListSimple tasks={assignedToMe} onSelect={setSelectedTask} />}
          </TabsContent>

          <TabsContent value="created">
            {loadingCreated && <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
            {!loadingCreated && !createdByMe?.length && (
              <EmptyState icon={CheckSquare} title="You haven't created any tasks" description="Tasks you create and assign to others will show up here." />
            )}
            {!!createdByMe?.length && <TaskListSimple tasks={createdByMe} onSelect={setSelectedTask} />}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTask && (
        <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(v) => !v && setSelectedTask(null)} />
      )}
    </div>
  );
}