import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Palette, Globe, Shield, KeyRound, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/settings")({
  head: () => ({ meta: [{ title: "Settings · HOD" }] }),
  component: SettingsPage,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

function SettingsPage() {
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  function closePasswordDialog() {
    setPwOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function submitPasswordChange() {
    if (!currentPassword || !newPassword) {
      toast.error("Fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update password");
        return;
      }
      toast.success("Password updated successfully.");
      closePasswordDialog();
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function notImplemented() {
    toast.info("This preference isn't backed by the server yet — nothing is saved.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage preferences and department configuration.</p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
        Only <b>Password</b> is currently connected to the server. Every other toggle below is a UI preview —
        changing it won't be saved or affect your account until these preferences are added to the backend.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={User} title="Profile Settings">
          <Row label="Display name" ctrl={<Button size="sm" variant="outline" className="rounded-lg" onClick={notImplemented}>Edit</Button>} />
          <Row label="Email visibility" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
          <Row label="Phone visibility" ctrl={<Switch onCheckedChange={notImplemented} />} />
        </Section>

        <Section icon={Bell} title="Notifications">
          <Row label="Enrollment requests" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
          <Row label="Attendance alerts" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
          <Row label="Marks pending reminders" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
          <Row label="Email digest" ctrl={<Switch onCheckedChange={notImplemented} />} />
        </Section>

        <Section icon={Palette} title="Theme">
          <Row label="Dark mode" ctrl={<Switch onCheckedChange={notImplemented} />} />
          <Row label="High-contrast" ctrl={<Switch onCheckedChange={notImplemented} />} />
        </Section>

        <Section icon={Globe} title="Language">
          <Row label="Interface" ctrl={<select onChange={notImplemented} className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option>English</option><option>नेपाली</option><option>हिन्दी</option></select>} />
          <Row label="Date format" ctrl={<select onChange={notImplemented} className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option>DD MMM YYYY</option><option>MM/DD/YYYY</option></select>} />
        </Section>

        <Section icon={Shield} title="Privacy">
          <Row label="Two-factor auth" ctrl={<Switch onCheckedChange={notImplemented} />} />
          <Row label="Activity log" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
        </Section>

        <Section icon={KeyRound} title="Password">
          <Row label="Change password" ctrl={<Button size="sm" variant="outline" className="rounded-lg" onClick={() => setPwOpen(true)}>Change</Button>} />
        </Section>

        <Section icon={Building2} title="Department Preferences">
          <Row label="Auto-approve enrollments" ctrl={<Switch onCheckedChange={notImplemented} />} />
          <Row label="Publish results after HOD review" ctrl={<Switch defaultChecked onCheckedChange={notImplemented} />} />
          <Row label="Attendance threshold (%)" ctrl={<input type="number" defaultValue={75} onChange={notImplemented} className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-sm" />} />
        </Section>
      </div>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={(o) => !o && closePasswordDialog()}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="settings-current-password">Current Password</Label>
              <Input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-password">New Password</Label>
              <Input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-password">Confirm New Password</Label>
              <Input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closePasswordDialog}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={saving} onClick={submitPasswordChange}>
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft"><Icon className="h-4 w-4" /></div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Row({ label, ctrl }: { label: string; ctrl: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
      <span>{label}</span>
      <div>{ctrl}</div>
    </div>
  );
}