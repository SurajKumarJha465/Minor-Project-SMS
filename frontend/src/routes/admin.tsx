import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SaSidebar } from "@/features/SuperAdmin/components/Sidebar";
import { SaTopbar } from "@/features/SuperAdmin/components/Topbar";
import { SaBottomNav } from "@/features/SuperAdmin/components/BottomNav";
import { authHeader } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <SaSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SaTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
        <SaBottomNav />
      </div>
      <ForcedPasswordChangeGate />
    </div>
  );
}

/**
 * Blocking dialog if the backend says this account's password must be
 * changed — either freshly created, or (when Security → "Password rotation"
 * is on) the current password has passed its 90-day age. Not dismissable
 * without a successful change, since that's the point of the setting.
 */
function ForcedPasswordChangeGate() {
  const [required, setRequired] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/me`, { headers: { ...authHeader() } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.must_change_password) setRequired(true);
      } catch {
        // silently skip — this is a soft nudge, not the source of truth for auth
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit() {
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
      toast.success("Password updated.");
      setRequired(false);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={required}>
      <DialogContent className="rounded-2xl sm:max-w-sm [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Password Change Required</DialogTitle>
          <DialogDescription>Your account requires a password update before you can continue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gate-current">Current Password</Label>
            <Input id="gate-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gate-new">New Password</Label>
            <Input id="gate-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gate-confirm">Confirm New Password</Label>
            <Input id="gate-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full rounded-xl gradient-brand text-white" disabled={saving} onClick={submit}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}