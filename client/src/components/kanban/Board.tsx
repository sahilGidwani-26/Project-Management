import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task, TaskStatus } from "@/types";
import { Column } from "./Column";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getSocket } from "@/lib/socket";

const STATUSES: TaskStatus[] = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

export function Board() {
  const { projectId, workspaceId } = useParams();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => (await api.get(`/tasks?projectId=${projectId}&limit=200`)).data.data as Task[],
    enabled: !!projectId,
  });

  // Real-time: join the project room and refetch on any task/comment event.
  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    socket.emit("project:join", projectId);

    const refetch = () => qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    socket.on("task:created", refetch);
    socket.on("task:updated", refetch);
    socket.on("task:moved", refetch);
    socket.on("task:deleted", refetch);

    return () => {
      socket.emit("project:leave", projectId);
      socket.off("task:created", refetch);
      socket.off("task:updated", refetch);
      socket.off("task:moved", refetch);
      socket.off("task:deleted", refetch);
    };
  }, [projectId, qc]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUSES.forEach((s) => (map[s] = []));
    (tasks || []).forEach((t) => map[t.status]?.push(t));
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;

    // Optimistic update so the drag feels instant.
    qc.setQueryData<Task[]>(["tasks", projectId], (old) => {
      if (!old) return old;
      return old.map((t) => (t._id === draggableId ? { ...t, status: newStatus, order: destination.index } : t));
    });

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus, order: destination.index });
    } finally {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto">
        {STATUSES.map((s) => (
          <Skeleton key={s} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-6 scrollbar-thin">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={grouped[status] || []}
              onTaskClick={setSelectedTask}
              onAddTask={setCreateStatus}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(v) => !v && setSelectedTask(null)} />
      )}
      {createStatus && (
        <CreateTaskDialog
          status={createStatus}
          projectId={projectId!}
          workspaceId={workspaceId!}
          open={!!createStatus}
          onOpenChange={(v) => !v && setCreateStatus(null)}
        />
      )}
    </>
  );
}
