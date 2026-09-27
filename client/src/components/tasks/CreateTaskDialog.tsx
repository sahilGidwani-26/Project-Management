import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { TaskStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssigneeMultiSelect } from "./AssigneeMultiSelect";
import { toast } from "sonner";

export function CreateTaskDialog({
  status,
  projectId,
  workspaceId,
  open,
  onOpenChange,
}: {
  status: TaskStatus;
  projectId: string;
  workspaceId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const addSubtaskDraft = () => {
    if (!subtaskDraft.trim()) return;
    setSubtasks((prev) => [...prev, subtaskDraft.trim()]);
    setSubtaskDraft("");
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    setSubtasks([]);
    setSubtaskDraft("");
    setStartDate("");
    setDueDate("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/tasks", {
        workspaceId,
        projectId,
        title,
        description,
        status,
        priority,
        assigneeIds,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        subtasks,
      });
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      onOpenChange(false);
      reset();
      toast.success("Task created");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>New task in {status}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design the login screen" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="## Overview&#10;Add more detail (optional) — supports ## heading, **bold**, - list"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <AssigneeMultiSelect workspaceId={workspaceId} value={assigneeIds} onChange={setAssigneeIds} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Urgent"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            {subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-sm">
                <span className="flex-1">{s}</span>
                <button type="button" onClick={() => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                placeholder="Add a subtask..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtaskDraft();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtaskDraft}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !title}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}