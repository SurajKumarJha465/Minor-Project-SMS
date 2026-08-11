import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Mail, Pencil, Phone, ShieldCheck, ShieldOff, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type HodProfile = {
  name: string;
  email: string;
  phone: string | null;
  two_factor_enabled: boolean;
};

// Settings is a snapshot + shortcuts page, not a second place to edit
// things. hod.profile.tsx already owns the real edit-contact, password
// change, photo upload and 2FA setup/disable flows — duplicating that
// logic here would just create a second source of truth for the same
// account state. Everything actionable routes there.
function SettingsPage() {
  const [hod, setHod] = useState<HodProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_URL}/api/hod/me`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        if (!cancelled) setHod(data);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Your account at a glance — edits happen on your Profile page.</p>
      </div>

      {loadError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          {loadError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft"><User className="h-4 w-4" /></div>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row icon={User} label="Name" value={loading ? "Loading…" : hod?.name ?? "—"} />
            <Row icon={Mail} label="Email" value={loading ? "Loading…" : hod?.email ?? "—"} />
            <Row icon={Phone} label="Phone" value={loading ? "Loading…" : hod?.phone ?? "Not set"} />
            <div className="pt-1">
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link to="/hod/profile"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit in Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft"><ShieldCheck className="h-4 w-4" /></div>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 text-sm">
              <span>Password</span>
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setPwOpen(true)}>
                <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Change
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {loading ? null : hod?.two_factor_enabled ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Two-Factor Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {loading ? "Loading…" : hod?.two_factor_enabled ? "Enabled" : "Disabled"}
                </span>
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link to="/hod/profile">Manage</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change password dialog — this one is real and cheap to keep here
          too (no separate setup flow like 2FA has), so it isn't worth
          forcing a trip to Profile just to change a password. */}
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

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2.5 text-sm last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span>{label}</span></div>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}