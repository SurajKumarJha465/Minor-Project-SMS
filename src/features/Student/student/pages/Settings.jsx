import { useState } from "react";
import { toast } from "sonner";
import { Bell, Globe, KeyRound, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/theme";
import { studentProfile } from "@/data/mock/student";

function Row({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [notif, setNotif] = useState({ email: true, push: true, exam: true, assignment: false });
  const [language, setLanguage] = useState("English");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, preferences and security.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile settings */}
        <SectionCard title="Profile Settings" icon={UserRound}>
          <Row title="Display Name" description={studentProfile.name}>
            <Button variant="outline" size="sm" onClick={() => toast.info("Edit name")}>Edit</Button>
          </Row>
          <Row title="Email" description={studentProfile.email}>
            <Button variant="outline" size="sm" onClick={() => toast.info("Edit email")}>Edit</Button>
          </Row>
          <Row title="Phone" description={studentProfile.phone}>
            <Button variant="outline" size="sm" onClick={() => toast.info("Edit phone")}>Edit</Button>
          </Row>
        </SectionCard>

        {/* Notification settings */}
        <SectionCard title="Notification Settings" icon={Bell}>
          <Row title="Email Notifications" description="Receive updates via email">
            <Switch checked={notif.email} onCheckedChange={(v) => setNotif((s) => ({ ...s, email: v }))} />
          </Row>
          <Row title="Push Notifications" description="Browser push alerts">
            <Switch checked={notif.push} onCheckedChange={(v) => setNotif((s) => ({ ...s, push: v }))} />
          </Row>
          <Row title="Exam Alerts" description="Datesheet and result updates">
            <Switch checked={notif.exam} onCheckedChange={(v) => setNotif((s) => ({ ...s, exam: v }))} />
          </Row>
          <Row title="Assignment Reminders" description="Due-date reminders">
            <Switch checked={notif.assignment} onCheckedChange={(v) => setNotif((s) => ({ ...s, assignment: v }))} />
          </Row>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="Appearance & Language" icon={Globe}>
          <Row title="Theme" description={isDark ? "Dark mode" : "Light mode"}>
            <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />} {isDark ? "Light" : "Dark"}
            </Button>
          </Row>
          <Row title="Language" description="Interface language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
            >
              {["English", "हिन्दी", "தமிழ்", "বাংলা"].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Row>
        </SectionCard>

        {/* Security & privacy */}
        <SectionCard title="Account Security & Privacy" icon={ShieldCheck}>
          <Row title="Password" description="Last changed 2 months ago">
            <Button variant="outline" size="sm" onClick={() => toast.info("Change password")}>
              <KeyRound className="size-4" /> Change
            </Button>
          </Row>
          <Row title="Two-Factor Authentication" description="Extra security on login">
            <Switch onCheckedChange={(v) => toast[v ? "success" : "message"](v ? "2FA enabled" : "2FA disabled")} />
          </Row>
          <Row title="Profile Visibility" description="Show profile to classmates">
            <Switch defaultChecked />
          </Row>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
      </div>
    </div>
  );
}
