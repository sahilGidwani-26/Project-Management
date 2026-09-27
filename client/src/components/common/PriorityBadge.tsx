import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={cn("border", PRIORITY_COLORS[priority])}>
      {priority}
    </Badge>
  );
}
