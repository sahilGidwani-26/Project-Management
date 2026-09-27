import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, apiError } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user, refetchUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ taskAssigned: true, mentions: true, comments: true, deadlines: true, workspaceInvites: true });

  useEffect(() => {
    setName(user?.name || "");
    setJobTitle(user?.jobTitle || "");
    setBio(user?.bio || "");
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me", { name, jobTitle, bio });
      await refetchUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async () => {
    try {
      await api.patch("/auth/notification-preferences", prefs);
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <div className="p-6 max-w-2xl">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profileImage} />
                    <AvatarFallback className="text-lg">{initials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Signed in</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Product Designer" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short introduction" />
                </div>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification preferences</CardTitle>
                <CardDescription>Choose what you get notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  taskAssigned: "Task assigned to me",
                  mentions: "Mentions",
                  comments: "Comments on my tasks",
                  deadlines: "Upcoming deadlines",
                  workspaceInvites: "Workspace invitations",
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={(prefs as any)[key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
                <Button onClick={savePrefs}>Save preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Use the theme toggle in the top bar to switch between light, dark, and system.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
