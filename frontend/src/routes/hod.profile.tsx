import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, GraduationCap, Award, Pencil, KeyRound, Building2, Camera, AlertTriangle, ShieldCheck, ShieldOff, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";
import { useAuthImgSrc } from "@/lib/AuthImg";

export const Route = createFileRoute("/hod/profile")({
  head: () => ({ meta: [{ title: "HOD Profile" }] }),
  component: Profile,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

function photoSrc(photo: string | null): string | undefined {
  if (!photo) return undefined;
  return photo.startsWith("http") ? photo : `${API_URL}${photo}`;
}

type HodProfile = {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string | null;
  qualification: string | null;
  experience: string | null;
  photo: string | null;
  must_change_password: boolean;
  two_factor_enabled: boolean;
};

function Profile() {
  const [hod, setHod] = useState<HodProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const avatarSrc = useAuthImgSrc(photoSrc(hod?.photo ?? null));

  // 2FA setup (secret shown for manual entry, then a 6-digit code confirms it)
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  // 2FA disable — also requires a current code, so a stolen session token
  // alone can't turn protection off
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);

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

  // Nudge the HoD the moment we know their password needs changing.
  useEffect(() => {
    if (hod?.must_change_password) {
      toast.warning("Your account requires a password change.", {
        description: "Please update your password to keep your account secure.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hod?.must_change_password]);

  function openEditDialog() {
    if (!hod) return;
    setEditEmail(hod.email ?? "");
    setEditPhone(hod.phone ?? "");
    setEditOpen(true);
  }

  async function submitContactEdit() {
    if (!editEmail.trim()) {
      toast.error("Email cannot be empty.");
      return;
    }
    setSavingContact(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ email: editEmail.trim(), phone: editPhone.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update contact details");
        return;
      }
      setHod(await res.json());
      toast.success("Contact details updated.");
      setEditOpen(false);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSavingContact(false);
    }
  }

  async function uploadPhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is larger than the 5 MB limit.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/hod/me/photo`, {
        method: "POST", headers: { ...authHeader() }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ?? "Failed to upload photo");
      setHod(data);
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function startTwoFaSetup() {
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/2fa/setup`, {
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
      const res = await fetch(`${API_URL}/api/hod/2fa/enable`, {
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
      setHod((h) => (h ? { ...h, two_factor_enabled: true } : h));
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
      const res = await fetch(`${API_URL}/api/hod/2fa/disable`, {
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
      setHod((h) => (h ? { ...h, two_factor_enabled: false } : h));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setDisableBusy(false);
    }
  }

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
      setHod((h) => (h ? { ...h, must_change_password: false } : h));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (loadError || !hod) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError ?? "Profile unavailable."}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hod.must_change_password && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Please update your password</p>
              <p className="text-xs text-muted-foreground">
                Your account is still using a temporary password. Change it now to keep your account secure.
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl" onClick={() => setPwOpen(true)}>
            <KeyRound className="mr-1.5 h-4 w-4" />Update Password Now
          </Button>
        </div>
      )}

      <Card className="overflow-hidden rounded-2xl border-0 gradient-brand text-white shadow-glass">
        <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="group relative h-24 w-24">
            <Avatar className="h-24 w-24 ring-4 ring-white/40">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{hod.name[0]}</AvatarFallback>
            </Avatar>
            <input
              ref={photoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPhoto(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              title="Change profile picture"
              className="absolute inset-0 grid place-items-center rounded-full bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
            >
              <Camera className="h-6 w-6" />
            </button>
            {uploadingPhoto && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-[10px] font-medium text-white">
                Uploading…
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/80">Head of Department</div>
            <h1 className="font-display text-3xl font-bold">{hod.name}</h1>
            <p className="mt-1 text-sm text-white/85">{hod.department}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-xl bg-white text-primary hover:bg-white/90"
              onClick={openEditDialog}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setPwOpen(true)}
            >
              <KeyRound className="mr-1.5 h-4 w-4" /> Password
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contact</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs" onClick={openEditDialog}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} k="Email" v={hod.email} />
            <Row icon={Phone} k="Phone" v={hod.phone ?? "—"} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Academic</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Building2} k="Department" v={hod.department} />
            <Row icon={GraduationCap} k="Qualification" v={hod.qualification ?? "—"} />
            <Row icon={Award} k="Experience" v={hod.experience ?? "—"} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                {hod.two_factor_enabled ? <ShieldCheck className="h-4 w-4 text-success" /> : <ShieldOff className="h-4 w-4" />}
                <span>Two-Factor Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {hod.two_factor_enabled ? "Enabled on this account" : "Not enabled"}
                </span>
                {hod.two_factor_enabled ? (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setDisableOpen(true)}>
                    Disable
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-lg" disabled={twoFaBusy} onClick={startTwoFaSetup}>
                    {twoFaBusy ? "Starting…" : "Enable"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit contact details dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Contact Details</DialogTitle>
            <DialogDescription>Your name and department are managed by your administrator.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={savingContact} onClick={submitContactEdit}>
              {savingContact ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Setup key (Google Authenticator, Authy, etc.)</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 text-sm font-semibold tracking-wider">
                  {twoFaSecret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(twoFaSecret);
                      toast.success("Copied to clipboard");
                    } catch {
                      toast.error("Could not copy — copy it manually");
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twofa-code">6-digit code</Label>
              <Input
                id="twofa-code"
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

      {/* 2FA disable dialog — a stolen session token alone shouldn't be able
          to turn protection off, so this still requires a current code. */}
      <Dialog open={disableOpen} onOpenChange={(o) => { if (!o) { setDisableOpen(false); setDisableCode(""); } }}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Enter a current code from your authenticator app to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="disable-twofa-code">6-digit code</Label>
            <Input
              id="disable-twofa-code"
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