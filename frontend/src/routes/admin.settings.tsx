import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Server, Database, Shield, Bell, Palette, Globe } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "System Settings · Super Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
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
            <Field label="Institution Name" defaultValue="Everest Institute of Technology" />
            <Field label="Academic Year" defaultValue="AY 2026-27" />
            <Field label="Current Semester" defaultValue="Fall 2026" />
            <Field label="Contact Email" defaultValue="admin@college.edu" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-base">Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Two-factor authentication (2FA)" desc="Require 2FA for all admin accounts" defaultChecked />
            <Toggle label="Session timeout" desc="Auto-logout after 30 minutes of inactivity" defaultChecked />
            <Toggle label="Password rotation" desc="Force password reset every 90 days" />
            <Toggle label="Audit logs" desc="Track all admin actions" defaultChecked />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Bell className="h-4 w-4 text-primary" /><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Email notifications" desc="System alerts to admin email" defaultChecked />
            <Toggle label="SMS alerts" desc="Critical alerts via SMS" />
            <Toggle label="Weekly summary" desc="Every Monday at 9 AM" defaultChecked />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Database className="h-4 w-4 text-primary" /><CardTitle className="text-base">Backup & Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Automatic backup" desc="Daily backup at 2:00 AM" defaultChecked />
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div>
                <div className="text-sm font-medium">Last backup</div>
                <div className="text-xs text-muted-foreground">Today · 02:00 AM · 1.2 GB</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg">Run now</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Palette className="h-4 w-4 text-primary" /><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Dark mode by default" desc="New users start in dark mode" />
            <Toggle label="Compact tables" desc="Denser table rows" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2"><Server className="h-4 w-4 text-primary" /><CardTitle className="text-base">System Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Version" v="EduPortal v2.4.1" />
            <Row k="Environment" v="Production" />
            <Row k="Region" v="Asia-South" />
            <Row k="Uptime" v="99.98% · 42 days" />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="rounded-xl">Cancel</Button>
        <Button className="rounded-xl gradient-brand text-white">Save Changes</Button>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input defaultValue={defaultValue} className="h-10 rounded-xl" />
    </div>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
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
