import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Pencil, Check } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Task } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { formatDate } from "@/lib/utils";
import { renderLiteMarkdown } from "@/lib/markdown";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { AssigneeMultiSelect } from "./AssigneeMultiSelect";
import { SubtasksSection } from "./SubtasksSection";
import { TaskDiscussion } from "./TaskDiscussion";

export function TaskDetailDialog({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const { canEditTask, canDeleteTask } = usePermissions();

  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds.map((u) => u._id));
  const [startDate, setStartDate] = useState(task.startDate?.slice(0, 10) || "");
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) || "");

  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(task.description || "");

  useEffect(() => {
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeIds(task.assigneeIds.map((u) => u._id));
    setStartDate(task.startDate?.slice(0, 10) || "");
    setDueDate(task.dueDate?.slice(0, 10) || "");
    setDescription(task.description || "");
    setEditingDescription(false);
  }, [task]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks", task.projectId] });

  const updateField = async (patch: Record<string, unknown>) => {
    try {
      await api.patch(`/tasks/${task._id}`, patch);
      refresh();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const changeStatus = async (v: string) => {
    setStatus(v as any);
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: v });
      refresh();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const changeAssignees = (ids: string[]) => {
    setAssigneeIds(ids);
    updateField({ assigneeIds: ids });
  };

  const saveDescription = async () => {
    await updateField({ description });
    setEditingDescription(false);
  };

  const deleteTask = async () => {
    try {
      await api.delete(`/tasks/${task._id}`);
      refresh();
      onOpenChange(false);
      toast.success("Task deleted");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Left: task fields */}
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="pr-6">{task.title}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select disabled={!canEditTask} value={status} onValueChange={changeStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Backlog", "Todo", "In Progress", "In Review", "Done"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select
                  disabled={!canEditTask}
                  value={priority}
                  onValueChange={(v) => { setPriority(v as any); updateField({ priority: v }); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Urgent"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Assignees</label>
              <AssigneeMultiSelect
                workspaceId={task.workspaceId}
                value={assigneeIds}
                onChange={changeAssignees}
                disabled={!canEditTask}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Start date</label>
                <Input
                  type="date"
                  disabled={!canEditTask}
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); updateField({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null }); }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Due date</label>
                <Input
                  type="date"
                  disabled={!canEditTask}
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); updateField({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null }); }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              {task.dueDate && <span className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</span>}
            </div>

            {/* Description: rendered lite-markdown, with an edit toggle */}
            <div className="border-t border-border pt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Description <span className="opacity-70">(supports ## heading, **bold**, - list)</span>
                </label>
                {canEditTask && !editingDescription && (
                  <button onClick={() => setEditingDescription(true)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {editingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]"
                    placeholder="## Overview&#10;What needs to happen and why."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingDescription(false); setDescription(task.description || ""); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveDescription}>
                      <Check className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              ) : task.description ? (
                <div
                  className="text-sm text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: renderLiteMarkdown(task.description) }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">No description yet.</p>
              )}
            </div>

            <SubtasksSection taskId={task._id} canEdit={canEditTask} />

            {canDeleteTask && (
              <div className="flex justify-end border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={deleteTask}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete task
                </Button>
              </div>
            )}
          </div>

          {/* Right: discussion panel */}
          <div className="hidden md:flex w-80 shrink-0 flex-col border-l border-border p-5 bg-secondary/20">
            <TaskDiscussion taskId={task._id} workspaceId={task.workspaceId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}