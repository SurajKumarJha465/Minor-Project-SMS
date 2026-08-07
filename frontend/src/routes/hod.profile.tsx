import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, GraduationCap, Award, Pencil, KeyRound, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/profile")({
  head: () => ({ meta: [{ title: "HOD Profile" }] }),
  component: Profile,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type HodProfile = {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string | null;
  qualification: string | null;
  experience: string | null;
  photo: string | null;
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
      <Card className="overflow-hidden rounded-2xl border-0 gradient-brand text-white shadow-glass">
        <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Avatar className="h-24 w-24 ring-4 ring-white/40">
            <AvatarImage src={hod.photo ?? undefined} />
            <AvatarFallback>{hod.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/80">Head of Department</div>
            <h1 className="font-display text-3xl font-bold">{hod.name}</h1>
            <p className="mt-1 text-sm text-white/85">{hod.department}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="rounded-xl bg-white text-primary hover:bg-white/90"
              onClick={() => toast.info("Profile details are managed by your administrator.")}
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
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
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