import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckSquare, Square, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Task } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SubtasksSection({ taskId, canEdit }: { taskId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: subtasks } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}/subtasks`)).data.data as Task[],
  });

  const toggle = async (subtask: Task) => {
    try {
      await api.patch(`/tasks/${subtask._id}/status`, { status: subtask.status === "Done" ? "Todo" : "Done" });
      qc.invalidateQueries({ queryKey: ["subtasks", taskId] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await api.post(`/tasks/${taskId}/subtasks`, { title: newTitle });
      setNewTitle("");
      qc.invalidateQueries({ queryKey: ["subtasks", taskId] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setAdding(false);
    }
  };

  const completed = subtasks?.filter((s) => s.status === "Done").length || 0;

  return (
    <div className="border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Subtasks</h4>
        {!!subtasks?.length && (
          <span className="text-xs text-muted-foreground">{completed}/{subtasks.length} completed</span>
        )}
      </div>

      <div className="space-y-1">
        {subtasks?.map((s) => (
          <button
            key={s._id}
            type="button"
            disabled={!canEdit}
            onClick={() => toggle(s)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary disabled:cursor-not-allowed",
              s.status === "Done" && "text-muted-foreground line-through"
            )}
          >
            {s.status === "Done" ? (
              <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {s.title}
          </button>
        ))}
      </div>

      {canEdit && (
        <form onSubmit={addSubtask} className="mt-2 flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask..."
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" className="h-8" disabled={adding || !newTitle.trim()}>
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </form>
      )}
    </div>
  );
}