import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, TrendingUp } from "lucide-react";
import { StatCard } from "@/features/Teacher/components/StatCard";
import { getAssignedCourses, getRosterFor, deptName, sectionLabel } from "@/features/Teacher/lib/academic-data";
import { DepartmentPicker, SemesterPicker, SectionPicker, DrillBreadcrumb, type DrillState } from "@/features/Teacher/components/DrillNav";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/teacher/performance")({
  head: () => ({ meta: [{ title: "Student Performance · Teacher Portal" }] }),
  component: PerformancePage,
});

function PerformancePage() {
  const [state, setState] = useState<DrillState>({});
  const [courseId, setCourseId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Student Performance</h1>
        <p className="text-sm text-muted-foreground">Select a department, semester, section and course to view its performance dashboard.</p>
      </div>

      {!courseId && (
        <>
          <DrillBreadcrumb state={state} onNavigate={setState} />
          {!state.dept && <DepartmentPicker onSelect={(dept) => setState({ dept })} />}
          {state.dept && !state.sem && <SemesterPicker onSelect={(sem) => setState({ dept: state.dept, sem })} />}
          {state.dept && state.sem && !state.section && (
            <SectionPicker onSelect={(section) => setState({ ...state, section })} />
          )}
          {state.dept && state.sem && state.section && (
            <CourseList dept={state.dept} sem={state.sem} section={state.section} onSelect={setCourseId} />
          )}
        </>
      )}

      {courseId && <PerformanceDashboard courseId={courseId} onBack={() => setCourseId(null)} />}
    </div>
  );
}

function CourseList({ dept, sem, section, onSelect }: { dept: string; sem: number; section: string; onSelect: (id: string) => void }) {
  const list = getAssignedCourses(dept, sem, section);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full">{deptName(dept)}</Badge>
        <Badge variant="secondary" className="rounded-full">Semester {sem}</Badge>
        <Badge variant="secondary" className="rounded-full">Section {sectionLabel(section)}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Card
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
          >
            <div className="gradient-brand relative h-20 p-4 text-white">
              <div className="text-[10px] uppercase tracking-widest opacity-80">{c.code}</div>
              <div className="mt-1 font-display text-base font-bold">{c.name}</div>
            </div>
            <CardContent className="flex items-center justify-between p-4 text-sm">
              <span className="text-xs text-muted-foreground">{c.enrolled} students</span>
              <span className="text-xs font-medium text-primary">View dashboard →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PerformanceDashboard({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [dept, semStr, section] = courseId.split("-");
  const sem = Number(semStr);
  const course = getAssignedCourses(dept, sem, section).find((c) => c.id === courseId);
  const roster = useMemo(() => getRosterFor(dept, sem, section), [dept, sem, section]);

  if (!course) return <p className="text-sm text-muted-foreground">Course not found.</p>;

  const avgAttendance = Math.round(roster.reduce((s, r) => s + r.attendance, 0) / roster.length);
  const avgMarks = Math.round(roster.reduce((s, r) => s + r.internal, 0) / roster.length);

  const attendanceBuckets = bucketize(roster.map((r) => r.attendance), [
    ["<70%", 0, 70], ["70-80%", 70, 80], ["80-90%", 80, 90], ["90-100%", 90, 101],
  ]);
  const marksBuckets = bucketize(roster.map((r) => r.internal), [
    ["0-40", 0, 40], ["40-60", 40, 60], ["60-80", 60, 80], ["80-100", 80, 101],
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course.code}</div>
          <h2 className="font-display text-xl font-bold">{course.name} · Performance Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={roster.length} icon={Award} tone="primary" />
        <StatCard label="Average Attendance" value={`${avgAttendance}%`} icon={TrendingUp} tone="success" />
        <StatCard label="Average Marks" value={`${avgMarks}/100`} icon={Award} tone="accent" />
        <StatCard label="Course" value={course.code} icon={Award} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Attendance Graph</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="count" fill="#4274D9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Internal Marks Graph</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="count" fill="#293681" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Course Statistics</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Enrolled" value={course.enrolled} />
            <MiniStat label="Credit Hours" value={course.credits} />
            <MiniStat label="Avg Attendance" value={`${avgAttendance}%`} />
            <MiniStat label="Avg Marks" value={avgMarks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function bucketize(values: number[], ranges: [string, number, number][]) {
  return ranges.map(([label, min, max]) => ({
    label,
    count: values.filter((v) => v >= min && v < max).length,
  }));
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}
