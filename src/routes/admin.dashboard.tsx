import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, ShieldCheck, Users, GraduationCap, CalendarRange, UserPlus, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { superAdmin, saAnalytics, deptDistribution } from "@/lib/superadmin-mock-data";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard · SMS" }] }),
  component: AdminDashboard,
});

const iconMap = { departments: Building2, hods: ShieldCheck, teachers: Users, students: GraduationCap, semesters: CalendarRange };

function AdminDashboard() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="relative overflow-hidden rounded-2xl border-0 gradient-brand p-0 text-white shadow-glass">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(600px 200px at 90% -20%, #fff, transparent 60%)" }} />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-white/80">{today}</div>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
              Welcome back, Super Administrator 👋
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              <b className="text-white">{superAdmin.college}</b> · {superAdmin.session} · {superAdmin.currentSemester}. You manage <b className="text-white">8 departments</b>, <b className="text-white">8 HODs</b> and <b className="text-white">214 teachers</b>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/admin/hods">
                <Button size="sm" variant="secondary" className="rounded-xl bg-white text-primary hover:bg-white/90">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Create HOD
                </Button>
              </Link>
              <Link to="/admin/teachers">
                <Button size="sm" variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <UserPlus className="mr-1.5 h-4 w-4" /> Create Teacher
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-widest text-white/70">Institution Snapshot</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center justify-between gap-6"><span>Departments</span><b>8</b></li>
                <li className="flex items-center justify-between gap-6"><span>HODs</span><b>8</b></li>
                <li className="flex items-center justify-between gap-6"><span>Teachers</span><b>214</b></li>
                <li className="flex items-center justify-between gap-6"><span>Students</span><b>4,820</b></li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {saAnalytics.map((a) => (
          <StatCard key={a.key} label={a.label} value={a.value} delta={a.delta} icon={iconMap[a.key as keyof typeof iconMap]} tone={a.tone as any} />
        ))}
      </div>

      {/* Quick actions */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: ShieldCheck, label: "Create HOD", to: "/admin/hods" },
            { icon: UserPlus, label: "Create Teacher", to: "/admin/teachers" },
            { icon: GraduationCap, label: "View Students", to: "/admin/students" },
            { icon: Building2, label: "System Settings", to: "/admin/settings" },
          ].map((a) => (
            <Link key={a.label} to={a.to} className="group flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                <a.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 text-sm font-medium">{a.label}</div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Charts */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2"><CardTitle className="text-base">Teachers per Department</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptDistribution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              <Bar dataKey="teachers" fill="#4274D9" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
