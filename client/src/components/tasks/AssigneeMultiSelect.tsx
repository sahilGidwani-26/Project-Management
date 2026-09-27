import { useQuery } from "@tanstack/react-query";
import { UserPlus, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { WorkspaceMember } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export function AssigneeMultiSelect({
  workspaceId,
  value,
  onChange,
  disabled,
}: {
  workspaceId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const { data: members } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/members`)).data.data as WorkspaceMember[],
    enabled: !!workspaceId,
  });

  const selected = members?.filter((m) => value.includes(m.userId._id)) || [];

  const toggle = (userId: string) => {
    if (value.includes(userId)) onChange(value.filter((id) => id !== userId));
    else onChange([...value, userId]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button type="button" variant="outline" className="w-full justify-between font-normal" disabled={disabled}>
          {selected.length === 0 ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <UserPlus className="h-4 w-4" /> Assign people
            </span>
          ) : (
            <span className="flex items-center gap-1.5 overflow-hidden">
              <span className="flex -space-x-2">
                {selected.slice(0, 4).map((m) => (
                  <Avatar key={m.userId._id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={m.userId.profileImage} />
                    <AvatarFallback className="text-[9px]">{initials(m.userId.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </span>
              <span className="truncate text-sm">
                {selected.length === 1 ? selected[0].userId.name : `${selected.length} people`}
              </span>
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {members?.map((m) => (
          <DropdownMenuCheckboxItem
            key={m.userId._id}
            checked={value.includes(m.userId._id)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(m.userId._id)}
          >
            <span className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={m.userId.profileImage} />
                <AvatarFallback className="text-[9px]">{initials(m.userId.name)}</AvatarFallback>
              </Avatar>
              {m.userId.name}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {!members?.length && <p className="px-2 py-1.5 text-xs text-muted-foreground">No members yet</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}