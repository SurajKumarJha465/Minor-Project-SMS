import { createFileRoute } from "@tanstack/react-router";
import { Bell, Palette, Globe, Shield, KeyRound, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hod/settings")({
  head: () => ({ meta: [{ title: "Settings · HOD" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage preferences and department configuration.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={User} title="Profile Settings">
          <Row label="Display name" ctrl={<Button size="sm" variant="outline" className="rounded-lg">Edit</Button>} />
          <Row label="Email visibility" ctrl={<Switch defaultChecked />} />
          <Row label="Phone visibility" ctrl={<Switch />} />
        </Section>

        <Section icon={Bell} title="Notifications">
          <Row label="Enrollment requests" ctrl={<Switch defaultChecked />} />
          <Row label="Attendance alerts" ctrl={<Switch defaultChecked />} />
          <Row label="Marks pending reminders" ctrl={<Switch defaultChecked />} />
          <Row label="Email digest" ctrl={<Switch />} />
        </Section>

        <Section icon={Palette} title="Theme">
          <Row label="Dark mode" ctrl={<Switch />} />
          <Row label="High-contrast" ctrl={<Switch />} />
        </Section>

        <Section icon={Globe} title="Language">
          <Row label="Interface" ctrl={<select className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option>English</option><option>नेपाली</option><option>हिन्दी</option></select>} />
          <Row label="Date format" ctrl={<select className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option>DD MMM YYYY</option><option>MM/DD/YYYY</option></select>} />
        </Section>

        <Section icon={Shield} title="Privacy">
          <Row label="Two-factor auth" ctrl={<Switch />} />
          <Row label="Activity log" ctrl={<Switch defaultChecked />} />
        </Section>

        <Section icon={KeyRound} title="Password">
          <Row label="Change password" ctrl={<Button size="sm" variant="outline" className="rounded-lg">Change</Button>} />
          <Row label="Last changed" ctrl={<span className="text-xs text-muted-foreground">32 days ago</span>} />
        </Section>

        <Section icon={Building2} title="Department Preferences">
          <Row label="Auto-approve enrollments" ctrl={<Switch />} />
          <Row label="Publish results after HOD review" ctrl={<Switch defaultChecked />} />
          <Row label="Attendance threshold (%)" ctrl={<input type="number" defaultValue={75} className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-sm" />} />
        </Section>
      </div>
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
