import { Draggable } from "@hello-pangea/dnd";
import { Calendar } from "lucide-react";
import { Task } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";

export function TaskCard({ task, index, onClick }: { task: Task; index: number; onClick: () => void }) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/40"
          )}
        >
          {!!task.labels?.length && (
            <div className="mb-2 flex flex-wrap gap-1">
              {task.labels.slice(0, 3).map((l) => (
                <Badge key={l} variant="secondary" className="text-[10px]">
                  {l}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px] text-muted-foreground",
                    isOverdue(task.dueDate) && task.status !== "Done" && "text-destructive font-medium"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
            {task.assigneeId && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assigneeId.profileImage} />
                <AvatarFallback className="text-[10px]">{initials(task.assigneeId.name)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
