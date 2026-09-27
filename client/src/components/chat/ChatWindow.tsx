import { useEffect, useRef, useState } from "react";
import { Hash, Lock, Send, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Channel, Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/common/EmptyState";
import { MessageSquare } from "lucide-react";

export function ChatWindow({ channel }: { channel: Channel | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const { data: messages } = useQuery({
    queryKey: ["messages", channel?._id],
    queryFn: async () => (await api.get(`/chat/channels/${channel!._id}/messages?limit=50`)).data.data as Message[],
    enabled: !!channel,
  });

  useEffect(() => {
    if (!channel) return;
    const socket = getSocket();
    socket.emit("channel:join", channel._id);

    const onNew = (msg: Message) => {
      if (msg.channelId !== channel._id) return;
      qc.setQueryData<Message[]>(["messages", channel._id], (old) => [...(old || []), msg]);
    };
    const onTyping = ({ userName }: { userName: string }) => {
      setTypingUsers((prev) => Array.from(new Set([...prev, userName])));
      setTimeout(() => setTypingUsers((prev) => prev.filter((n) => n !== userName)), 3000);
    };

    socket.on("message:new", onNew);
    socket.on("channel:typing", onTyping);

    return () => {
      socket.emit("channel:leave", channel._id);
      socket.off("message:new", onNew);
      socket.off("channel:typing", onTyping);
    };
  }, [channel, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !channel) return;
    setSending(true);
    try {
      await api.post(`/chat/channels/${channel._id}/messages`, { content });
      setContent("");
    } finally {
      setSending(false);
    }
  };

  const onTyping = () => {
    if (!channel) return;
    getSocket().emit("channel:typing", { channelId: channel._id, userName: user?.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => getSocket().emit("channel:stop-typing", { channelId: channel._id }), 2000);
  };

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState icon={MessageSquare} title="Select a channel" description="Choose a channel or direct message to start chatting." />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {channel.type === "channel" ? (
          channel.isPrivate ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />
        ) : null}
        <span className="font-semibold">
          {channel.type === "channel" ? channel.name : (channel as any).otherMember?.name || "Direct message"}
        </span>
        {channel.description && <span className="text-sm text-muted-foreground">— {channel.description}</span>}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {messages?.map((m, i) => {
          const prev = messages[i - 1];
          const showHeader = !prev || prev.senderId._id !== m.senderId._id;
          return <MessageBubble key={m._id} message={m} showHeader={showHeader} />;
        })}
        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 pb-1 text-xs text-muted-foreground italic">{typingUsers.join(", ")} typing...</div>
      )}

      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onTyping();
          }}
          placeholder={`Message ${channel.type === "channel" ? "#" + channel.name : ""}`}
          className="min-h-[42px] py-2.5"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={sending || !content.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
