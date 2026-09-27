import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Paperclip, X, FileText, ImageIcon } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Comment, WorkspaceMember, Attachment } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, initials } from "@/lib/utils";
import { renderLiteMarkdown } from "@/lib/markdown";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

export function TaskDiscussion({ taskId, workspaceId }: { taskId: string; workspaceId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { canComment } = usePermissions();
  const [content, setContent] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: comments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}/comments`)).data.data as Comment[],
  });

  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/members`)).data.data as WorkspaceMember[],
  });

  const { data: attachments } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => (await api.get(`/attachments?taskId=${taskId}`)).data.data as Attachment[],
  });

  const matchingMembers =
    mentionQuery !== null
      ? (members || []).filter((m) => m.userId.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      : [];

  const onContentChange = (value: string) => {
    setContent(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const upToCursor = value.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setMentionQuery(null);
      return;
    }
    const afterAt = upToCursor.slice(atIndex + 1);
    if (/\s/.test(afterAt)) {
      setMentionQuery(null);
    } else {
      setMentionQuery(afterAt);
    }
  };

  const pickMention = (member: WorkspaceMember) => {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const upToCursor = content.slice(0, cursor);
    const atIndex = upToCursor.lastIndexOf("@");
    const before = content.slice(0, atIndex);
    const after = content.slice(cursor);
    const newContent = `${before}@${member.userId.name} ${after}`;
    setContent(newContent);
    setMentionIds((prev) => Array.from(new Set([...prev, member.userId._id])));
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content, mentions: mentionIds });
      setContent("");
      setMentionIds([]);
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPosting(false);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);
      await api.post("/attachments", formData, { headers: { "Content-Type": "multipart/form-data" } });
      qc.invalidateQueries({ queryKey: ["attachments", taskId] });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("File attached");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <h4 className="mb-3 text-sm font-semibold shrink-0">Discussion</h4>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1 min-h-0">
        {!!attachments?.length && (
          <div className="space-y-1.5 pb-2 border-b border-border">
            {attachments.map((a) => (
              <a
                key={a._id}
                href={a.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-secondary"
              >
                {a.fileType.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                <span className="truncate flex-1">{a.fileName}</span>
                <span className="text-muted-foreground">{(a.fileSize / 1024).toFixed(0)} KB</span>
              </a>
            ))}
          </div>
        )}

        {!comments?.length && <p className="text-sm text-muted-foreground">No comments yet — start the conversation.</p>}
        {comments?.map((c) => (
          <div key={c._id} className="flex gap-2.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={c.userId.profileImage} />
              <AvatarFallback className="text-[10px]">{initials(c.userId.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.userId.name}</span>
                <span className="text-[11px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
              </div>
              <div
                className="text-sm text-foreground/90 [&_p]:mb-0"
                dangerouslySetInnerHTML={{ __html: renderLiteMarkdown(c.content) }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 pt-3 border-t border-border mt-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-xs">
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1">{file.name}</span>
            <button type="button" onClick={() => setFile(null)}><X className="h-3.5 w-3.5" /></button>
            <Button type="button" size="sm" className="h-6 text-xs" disabled={uploading} onClick={uploadFile}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Attach"}
            </Button>
          </div>
        )}

        <form onSubmit={postComment} className="relative flex items-end gap-2">
          {mentionQuery !== null && matchingMembers.length > 0 && (
            <div className="absolute bottom-full left-9 mb-1 w-56 rounded-md border border-border bg-popover shadow-md z-10">
              {matchingMembers.map((m) => (
                <button
                  type="button"
                  key={m.userId._id}
                  onClick={() => pickMention(m)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-secondary text-left"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={m.userId.profileImage} />
                    <AvatarFallback className="text-[9px]">{initials(m.userId.name)}</AvatarFallback>
                  </Avatar>
                  {m.userId.name}
                </button>
              ))}
            </div>
          )}

          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="text-[10px]">{initials(user?.name)}</AvatarFallback>
          </Avatar>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={!canComment}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={canComment ? "Write a comment... use @ to mention, ## for a heading" : "You have read-only access"}
            disabled={!canComment}
            className="min-h-[38px] py-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) {
                e.preventDefault();
                postComment(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!canComment || posting || !content.trim()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}