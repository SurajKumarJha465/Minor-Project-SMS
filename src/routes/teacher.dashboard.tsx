import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen, Users, Camera, Megaphone, PenSquare, Eye, FileBarChart, ArrowRight,
  CheckCheck, Award, Bell, FileText, MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/features/Teacher/components/StatCard";
import { teacher, courses, activities } from "@/features/Teacher/lib/mock-data";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Teacher Portal" }] }),
  component: Dashboard,
});

const activityIcons = { check: CheckCheck, award: Award, bell: Bell, file: FileText, message: MessageCircle };

function Dashboard() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const totalStudents = courses.reduce((s, c) => s + c.enrolled, 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="relative overflow-hidden rounded-2xl border-0 gradient-brand p-0 text-white shadow-glass">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(600px 200px at 90% -20%, #fff, transparent 60%)" }} />
        <div className="relative p-6 md:p-8">
          <div className="text-xs font-medium uppercase tracking-widest text-white/80">{today}</div>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
            Welcome back, {teacher.title} {teacher.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/80">
            {teacher.department} · {teacher.semester}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/attendance">
              <Button size="sm" variant="secondary" className="rounded-xl bg-white text-primary hover:bg-white/90">
                <Camera className="mr-1.5 h-4 w-4" /> Take Attendance
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Courses" value={courses.length} icon={BookOpen} tone="primary" />
        <StatCard label="Total Students" value={totalStudents} icon={Users} tone="accent" />
      </div>

      {/* Quick actions */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Camera, label: "Take Attendance", to: "/attendance" },
            { icon: Megaphone, label: "View Notice", to: "/notices" },
            { icon: PenSquare, label: "Enter Marks", to: "/marks" },
            { icon: Eye, label: "View Students", to: "/courses" },
            { icon: FileBarChart, label: "Generate Report", to: "/reports" },
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

      {/* Recent Activity */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-5">
            {activities.map((a, i) => {
              const Icon = activityIcons[a.icon as keyof typeof activityIcons];
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] grid h-6 w-6 place-items-center rounded-full bg-secondary text-primary ring-4 ring-background">
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/80">{a.time}</div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
