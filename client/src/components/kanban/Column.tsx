import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const columnAccent: Record<string, string> = {
  Backlog: "bg-slate-400",
  Todo: "bg-blue-500",
  "In Progress": "bg-amber-500",
  "In Review": "bg-violet-500",
  Done: "bg-emerald-500",
};

export function Column({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", columnAccent[status])} />
          <span className="text-sm font-semibold">{status}</span>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddTask(status)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 overflow-y-auto scrollbar-thin px-2 pb-2",
              "min-h-[120px] max-h-[calc(100vh-13rem)]",
              snapshot.isDraggingOver && "bg-primary/5 rounded-md"
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} onClick={() => onTaskClick(task)} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
