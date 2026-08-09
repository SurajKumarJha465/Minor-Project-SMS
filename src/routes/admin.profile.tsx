import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Mail, Phone, Shield, Pencil, KeyRound, ShieldCheck, ShieldOff, Building2, Award, Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Super Admin Profile" }] }),
  component: ProfilePage,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type AdminProfile = {
  name: string;
  title: string | null;
  email: string;
  phone: string | null;
  institution: string | null;
  qualification: string | null;
  experience: string | null;
  photo: string | null;
  must_change_password: boolean;
  two_factor_enabled: boolean;
};

function ProfilePage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // 2FA enroll flow
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  // 2FA disable flow
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/me`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const data = await res.json();
      setAdmin(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

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

  async function startTwoFaSetup() {
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/setup`, {
        method: "POST",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Could not start 2FA setup");
        return;
      }
      const data = await res.json();
      setTwoFaSecret(data.secret);
      setTwoFaOpen(true);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setTwoFaBusy(false);
    }
  }

  function closeTwoFaModal() {
    setTwoFaOpen(false);
    setTwoFaSecret("");
    setTwoFaCode("");
  }

  async function confirmTwoFa() {
    if (twoFaCode.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code: twoFaCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Invalid code, try again.");
        return;
      }
      toast.success("Two-factor authentication enabled.");
      closeTwoFaModal();
      setAdmin((a) => (a ? { ...a, two_factor_enabled: true } : a));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function confirmDisableTwoFa() {
    if (disableCode.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setDisableBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Invalid code, try again.");
        return;
      }
      toast.success("Two-factor authentication disabled.");
      setDisableOpen(false);
      setDisableCode("");
      setAdmin((a) => (a ? { ...a, two_factor_enabled: false } : a));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setDisableBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (loadError || !admin) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError ?? "Profile unavailable."}</p>
        <Button size="sm" variant="outline" onClick={loadProfile}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-2xl border-0 gradient-brand text-white shadow-glass">
        <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-24 w-24 ring-4 ring-white/40">
            <AvatarImage src={admin.photo ?? undefined} />
            <AvatarFallback>{admin.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/80">{admin.title || "Super Administrator"}</div>
            <h1 className="font-display text-3xl font-bold">{admin.name}</h1>
            <p className="mt-1 text-sm text-white/85">{admin.institution ?? "—"}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-xl bg-white text-primary hover:bg-white/90"
              onClick={() => toast.info("Profile detail editing isn't wired up yet.")}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Edit Profile
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setPwOpen(true)}
            >
              <KeyRound className="mr-1.5 h-4 w-4" /> Change Password
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} k="Email" v={admin.email} />
            <Row icon={Phone} k="Phone" v={admin.phone ?? "—"} />
            <Row icon={Building2} k="Institution" v={admin.institution ?? "—"} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={ShieldCheck} k="Role" v="Super Administrator" />
            <Row icon={Award} k="Qualification" v={admin.qualification ?? "—"} />
            <Row icon={Shield} k="Experience" v={admin.experience ?? "—"} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Two-Factor Authentication</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {admin.two_factor_enabled ? (
                  <Badge className="gap-1 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                    <ShieldCheck className="h-3.5 w-3.5" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 rounded-lg">
                    <ShieldOff className="h-3.5 w-3.5" /> Not enabled
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {admin.two_factor_enabled
                    ? "Your account requires a code from your authenticator app at login."
                    : "Add a second step to your login using an authenticator app."}
                </p>
              </div>
              {admin.two_factor_enabled ? (
                <Button variant="outline" className="rounded-xl" onClick={() => setDisableOpen(true)}>
                  <ShieldOff className="mr-1.5 h-4 w-4" /> Disable 2FA
                </Button>
              ) : (
                <Button className="rounded-xl gradient-brand text-white" disabled={twoFaBusy} onClick={startTwoFaSetup}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> {twoFaBusy ? "Preparing…" : "Enable 2FA"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
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

      {/* 2FA setup dialog */}
      <Dialog open={twoFaOpen} onOpenChange={(o) => !o && closeTwoFaModal()}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Enter this key in your authenticator app, then confirm with a code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Setup key (Google Authenticator, Authy, etc.)</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 text-sm font-semibold tracking-wider">{twoFaSecret}</code>
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(twoFaSecret);
                      toast.success("Copied to clipboard");
                    } catch {
                      toast.error("Could not copy — copy it manually");
                    }
                  }}
                  aria-label="Copy setup key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enable-code">6-digit code</Label>
              <Input
                id="enable-code"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className="text-center text-lg font-semibold tracking-[0.5em]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeTwoFaModal}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={twoFaBusy} onClick={confirmTwoFa}>
              {twoFaBusy ? "Verifying…" : "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA disable dialog */}
      <Dialog open={disableOpen} onOpenChange={(o) => { if (!o) { setDisableOpen(false); setDisableCode(""); } }}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Enter a current code from your authenticator app to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="disable-code">6-digit code</Label>
            <Input
              id="disable-code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="text-center text-lg font-semibold tracking-[0.5em]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setDisableOpen(false); setDisableCode(""); }}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" disabled={disableBusy} onClick={confirmDisableTwoFa}>
              {disableBusy ? "Disabling…" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v, icon: Icon }: { k: string; v: string; icon: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span>{k}</span></div>
      <div className="text-right font-medium">{v}</div>
    </div>
  );
}