import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Channel, WorkspaceMember } from "@/types";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function Chat() {
  const { workspaceId } = useParams();
  const qc = useQueryClient();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const { data: channels } = useQuery({
    queryKey: ["channels", workspaceId],
    queryFn: async () => (await api.get(`/chat/channels/workspace/${workspaceId}`)).data.data as Channel[],
    enabled: !!workspaceId,
  });

  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/members`)).data.data as WorkspaceMember[],
    enabled: !!workspaceId,
  });

  const createChannel = async (name: string, isPrivate: boolean) => {
    const res = await api.post("/chat/channels", { workspaceId, name, isPrivate });
    qc.invalidateQueries({ queryKey: ["channels", workspaceId] });
    setActiveChannel(res.data.data);
  };

  const openDM = async (otherUserId: string) => {
    const res = await api.post(`/chat/channels/workspace/${workspaceId}/dm`, { otherUserId });
    const other = members?.find((m) => m.userId._id === otherUserId)?.userId;
    const dm = { ...res.data.data, otherMember: other };
    qc.invalidateQueries({ queryKey: ["channels", workspaceId] });
    setActiveChannel(dm);
  };

  // Attach the "other member" to each DM channel for display purposes.
  const enrichedChannels = (channels || []).map((c) => {
    if (c.type !== "dm" || !members) return c;
    const otherId = c.members.find((id) => id !== (c as any).createdBy);
    const other = members.find((m) => m.userId._id === otherId)?.userId;
    return { ...c, otherMember: other };
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <ChannelSidebar
        channels={enrichedChannels}
        members={members || []}
        activeChannelId={activeChannel?._id}
        onSelect={setActiveChannel}
        onCreateChannel={createChannel}
        onOpenDM={openDM}
      />
      <ChatWindow channel={activeChannel} />
    </div>
  );
}
