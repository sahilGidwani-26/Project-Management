import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => (await api.get(`/admin/users?search=${search}&limit=30`)).data.data,
  });

  const toggleSuspend = async (userId: string, suspended: boolean) => {
    await api.patch(`/admin/users/${userId}/${suspended ? "reactivate" : "suspend"}`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success(suspended ? "User reactivated" : "User suspended");
  };

  return (
    <div>
      <PageHeader title="Users" description="Manage platform users" />
      <div className="p-6">
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Email</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.map((u: any) => (
                <tr key={u._id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.profileImage} />
                        <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      {u.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={u.accountStatus === "active" ? "secondary" : "destructive"}>{u.accountStatus}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggleSuspend(u._id, u.accountStatus === "suspended")}>
                      {u.accountStatus === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
