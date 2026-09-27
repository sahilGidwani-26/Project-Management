import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, initials } from "@/lib/utils";

export function MessageBubble({ message, showHeader }: { message: Message; showHeader: boolean }) {
  return (
    <div className="flex gap-2.5 px-4 py-1 hover:bg-secondary/30 rounded-md">
      <div className="w-8 shrink-0">
        {showHeader && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.senderId.profileImage} />
            <AvatarFallback className="text-[10px]">{initials(message.senderId.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{message.senderId.name}</span>
            <span className="text-[11px] text-muted-foreground">{formatDateTime(message.createdAt)}</span>
          </div>
        )}
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{message.content}</p>
        {!!message.reactions?.length && (
          <div className="mt-1 flex gap-1">
            {Object.entries(
              message.reactions.reduce<Record<string, number>>((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <span key={emoji} className="rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
