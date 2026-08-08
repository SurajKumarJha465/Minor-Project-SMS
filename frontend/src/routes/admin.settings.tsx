import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Server, Database, Shield, Bell, Palette, Globe } from "lucide-react";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "System Settings · Super Admin" }] }),
  component: SettingsPage,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type Settings = {
  institution_name: string;
  academic_year: string;
  current_semester_label: string;
  contact_email: string;
  require_2fa: boolean;
  session_timeout_enabled: boolean;
  password_rotation_enabled: boolean;
  audit_logs_enabled: boolean;
  email_notifications: boolean;
  sms_alerts: boolean;
  weekly_summary: boolean;
  auto_backup_enabled: boolean;
  last_backup_at: string | null;
  dark_mode_default: boolean;
  compact_tables: boolean;
};

type SystemInfo = {
  version: string;
  environment: string;
  database: string;
  uptime_seconds: number;
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLastBackup(iso: string | null): string {
  if (!iso) return "Never run";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dirty, setDirty] = useState<Partial<Settings>>({});
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [settingsRes, infoRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/settings`, { headers: { ...authHeader() } }),
        fetch(`${API_URL}/api/admin/settings/system-info`, { headers: { ...authHeader() } }),
      ]);
      if (!settingsRes.ok) throw new Error(`Failed to load settings (${settingsRes.status})`);
      if (!infoRes.ok) throw new Error(`Failed to load system info (${infoRes.status})`);
      const [settingsData, infoData] = await Promise.all([settingsRes.json(), infoRes.json()]);
      setSettings(settingsData);
      setSysInfo(infoData);
      setDirty({});
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const merged = settings ? { ...settings, ...dirty } : null;

  function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDirty((d) => ({ ...d, [key]: value }));
  }

  async function saveChanges() {
    if (Object.keys(dirty).length === 0) {
      toast.info("Nothing to save.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(dirty),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to save settings");
        return;
      }
      const updated = await res.json();
      setSettings(updated);
      setDirty({});
      toast.success("Settings saved.");
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    setDirty({});
  }

  async function runBackupNow() {
    setBackingUp(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/backup`, {
        method: "POST",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        toast.error("Failed to trigger backup");
        return;
      }
      const data = await res.json();
      setSettings((s) => (s ? { ...s, last_backup_at: data.last_backup_at } : s));
      toast.success("Backup triggered.");
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setBackingUp(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  if (loadError || !merged) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError ?? "Settings unavailable."}</p>
        <Button size="sm" variant="outline" onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-muted-foreground">Institution-wide configuration and preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Globe className="h-4 w-4 text-primary" /><CardTitle className="text-base">Institution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Institution Name" value={merged.institution_name} onChange={(v) => setField("institution_name", v)} />
            <Field label="Academic Year" value={merged.academic_year} onChange={(v) => setField("academic_year", v)} />
            <Field label="Current Semester" value={merged.current_semester_label} onChange={(v) => setField("current_semester_label", v)} />
            <Field label="Contact Email" value={merged.contact_email} onChange={(v) => setField("contact_email", v)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-base">Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Two-factor authentication (2FA)" desc="Require 2FA for all admin accounts" checked={merged.require_2fa} onChange={(v) => setField("require_2fa", v)} />
            <Toggle label="Session timeout" desc="Auto-logout after 30 minutes of inactivity" checked={merged.session_timeout_enabled} onChange={(v) => setField("session_timeout_enabled", v)} />
            <Toggle label="Password rotation" desc="Force password reset every 90 days" checked={merged.password_rotation_enabled} onChange={(v) => setField("password_rotation_enabled", v)} />
            <Toggle label="Audit logs" desc="Track all admin actions" checked={merged.audit_logs_enabled} onChange={(v) => setField("audit_logs_enabled", v)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Bell className="h-4 w-4 text-primary" /><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Email notifications" desc="System alerts to admin email" checked={merged.email_notifications} onChange={(v) => setField("email_notifications", v)} />
            <Toggle label="SMS alerts" desc="Critical alerts via SMS" checked={merged.sms_alerts} onChange={(v) => setField("sms_alerts", v)} />
            <Toggle label="Weekly summary" desc="Every Monday at 9 AM" checked={merged.weekly_summary} onChange={(v) => setField("weekly_summary", v)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Database className="h-4 w-4 text-primary" /><CardTitle className="text-base">Backup & Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Automatic backup" desc="Daily backup at 2:00 AM" checked={merged.auto_backup_enabled} onChange={(v) => setField("auto_backup_enabled", v)} />
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <div className="text-sm font-medium">Last backup</div>
                <div className="text-xs text-muted-foreground">{formatLastBackup(merged.last_backup_at)}</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" disabled={backingUp} onClick={runBackupNow}>
                {backingUp ? "Running…" : "Run now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Palette className="h-4 w-4 text-primary" /><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Dark mode by default" desc="New users start in dark mode" checked={merged.dark_mode_default} onChange={(v) => setField("dark_mode_default", v)} />
            <Toggle label="Compact tables" desc="Denser table rows" checked={merged.compact_tables} onChange={(v) => setField("compact_tables", v)} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Server className="h-4 w-4 text-primary" /><CardTitle className="text-base">System Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Version" v={sysInfo?.version ?? "—"} />
            <Row k="Environment" v={sysInfo?.environment ?? "—"} />
            <Row k="Database" v={sysInfo?.database ?? "—"} />
            <Row k="Uptime" v={sysInfo ? formatUptime(sysInfo.uptime_seconds) : "—"} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="rounded-xl" disabled={Object.keys(dirty).length === 0} onClick={cancelChanges}>Cancel</Button>
        <Button className="rounded-xl gradient-brand text-white" disabled={saving || Object.keys(dirty).length === 0} onClick={saveChanges}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-xl" />
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}