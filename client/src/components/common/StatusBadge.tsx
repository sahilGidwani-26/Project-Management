import { STATUS_COLORS, cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", STATUS_COLORS[status])}>
      {status}
    </span>
  );
}
