import { useState } from "react";
import { Hash, Lock, Plus } from "lucide-react";
import { Channel, WorkspaceMember } from "@/types";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function ChannelSidebar({
  channels,
  members,
  activeChannelId,
  onSelect,
  onCreateChannel,
  onOpenDM,
}: {
  channels: Channel[];
  members: WorkspaceMember[];
  activeChannelId?: string;
  onSelect: (channel: Channel) => void;
  onCreateChannel: (name: string, isPrivate: boolean) => Promise<void>;
  onOpenDM: (userId: string) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const publicChannels = channels.filter((c) => c.type === "channel");
  const dms = channels.filter((c) => c.type === "dm");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await onCreateChannel(name.toLowerCase().replace(/\s+/g, "-"), false);
      setOpen(false);
      setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex w-60 shrink-0 flex-col border-r border-border bg-secondary/30">
      <div className="p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channels</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-1.5 space-y-0.5">
          {publicChannels.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                activeChannelId === c._id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/80"
              )}
            >
              {c.isPrivate ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Hash className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 pt-0">
        <span className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direct messages</span>
        <div className="mt-1.5 space-y-0.5">
          {dms.map((c) => {
            const other = (c as any).otherMember;
            return (
              <button
                key={c._id}
                onClick={() => onSelect(c)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  activeChannelId === c._id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/80"
                )}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={other?.profileImage} />
                  <AvatarFallback className="text-[9px]">{initials(other?.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{other?.name || "Direct message"}</span>
              </button>
            );
          })}
        </div>

        <span className="mt-4 block px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team</span>
        <div className="mt-1.5 space-y-0.5">
          {members
            .filter((m) => m.userId._id !== user?._id)
            .map((m) => (
              <button
                key={m._id}
                onClick={() => onOpenDM(m.userId._id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={m.userId.profileImage} />
                  <AvatarFallback className="text-[9px]">{initials(m.userId.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{m.userId.name}</span>
              </button>
            ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Channel name</Label>
              <Input id="cname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="design-team" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || !name}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
