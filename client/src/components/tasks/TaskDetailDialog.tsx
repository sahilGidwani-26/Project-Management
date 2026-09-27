import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Comment, Task } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { formatDateTime, initials } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function TaskDetailDialog({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);

  useEffect(() => {
    setStatus(task.status);
    setPriority(task.priority);
  }, [task]);

  const { data: comments } = useQuery({
    queryKey: ["comments", task._id],
    queryFn: async () => (await api.get(`/tasks/${task._id}/comments`)).data.data as Comment[],
  });

  const updateField = async (field: string, value: string) => {
    try {
      if (field === "status") {
        await api.patch(`/tasks/${task._id}/status`, { status: value });
      } else {
        await api.patch(`/tasks/${task._id}`, { [field]: value });
      }
      qc.invalidateQueries({ queryKey: ["tasks", task.projectId] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${task._id}/comments`, { content });
      setContent("");
      qc.invalidateQueries({ queryKey: ["comments", task._id] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPosting(false);
    }
  };

  const deleteTask = async () => {
    try {
      await api.delete(`/tasks/${task._id}`);
      qc.invalidateQueries({ queryKey: ["tasks", task.projectId] });
      onOpenChange(false);
      toast.success("Task deleted");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v as any); updateField("status", v); }}>
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
            <Select value={priority} onValueChange={(v) => { setPriority(v as any); updateField("priority", v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Low", "Medium", "High", "Urgent"].map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">Due {formatDateTime(task.dueDate)}</span>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="mb-3 text-sm font-semibold">Comments</h4>
          <div className="max-h-56 space-y-3 overflow-y-auto scrollbar-thin pr-1">
            {!comments?.length && <p className="text-sm text-muted-foreground">No comments yet — start the conversation.</p>}
            {comments?.map((c) => (
              <div key={c._id} className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={c.userId.profileImage} />
                  <AvatarFallback className="text-[10px]">{initials(c.userId.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.userId.name}</span>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={postComment} className="mt-3 flex items-end gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback className="text-[10px]">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[38px] py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  postComment(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={posting || !content.trim()}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={deleteTask}>
            <Trash2 className="h-3.5 w-3.5" /> Delete task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
