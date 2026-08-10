import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, TrendingUp } from "lucide-react";
import { StatCard } from "@/features/Teacher/components/StatCard";
import {
  getTeacherCourses, getTeacherDepartments, getCoursePerformance,
  deptName, sectionLabel, semesters, sections,
  type TeacherCourse, type TeacherDepartmentDto, type CoursePerformanceDto,
} from "@/features/Teacher/lib/academic-data";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/teacher/performance")({
  head: () => ({ meta: [{ title: "Student Performance · Teacher Portal" }] }),
  component: PerformancePage,
});

function PerformancePage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDepartments, setMyDepartments] = useState<TeacherDepartmentDto[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);

  const [dept, setDept] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [section, setSection] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherCourses()
      .then((list) => { if (!cancelled) setCourses(list); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTeacherDepartments().then((list) => { if (!cancelled) setMyDepartments(list); });
    return () => { cancelled = true; };
  }, []);

  const deptNameById = useMemo(
    () => new Map(myDepartments.map((d) => [d.id, d.name])),
    [myDepartments],
  );

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const sec = c.section ?? c.id.split("-")[2] ?? "d";
      const byDept = dept === "all" || c.dept === dept;
      const bySem = sem === "all" || String(c.sem) === sem;
      const bySection = section === "all" || sec === section;
      return byDept && bySem && bySection;
    });
  }, [courses, dept, sem, section]);

  if (courseId) {
    return <PerformanceDashboard courseId={courseId} onBack={() => setCourseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Student Performance</h1>
        <p className="text-sm text-muted-foreground">Select one of your courses to view its performance dashboard.</p>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <select className="rounded-xl border bg-background p-2 text-sm" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">All Departments</option>
            {myDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="rounded-xl border bg-background p-2 text-sm" value={sem} onChange={(e) => setSem(e.target.value)}>
            <option value="all">All Semesters</option>
            {semesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
          </select>
          <select className="rounded-xl border bg-background p-2 text-sm" value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="all">All Sections</option>
            {sections.map((s) => <option key={s.id} value={s.id}>Section {s.label}</option>)}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assigned courses found for selected filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const sec = c.section ?? c.id.split("-")[2] ?? "d";
            return (
              <Card
                key={c.id}
                onClick={() => setCourseId(c.id)}
                className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="gradient-brand relative h-20 p-4 text-white">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{c.code}</div>
                  <div className="mt-1 font-display text-base font-bold">{c.name}</div>
                </div>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-full">{deptNameById.get(c.dept) ?? deptName(c.dept)}</Badge>
                    <Badge variant="secondary" className="rounded-full">Sem {c.sem}</Badge>
                    <Badge variant="secondary" className="rounded-full">Sec {sectionLabel(sec)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.enrolled} students</span>
                    <span className="text-xs font-medium text-primary">View dashboard →</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PerformanceDashboard({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [data, setData] = useState<CoursePerformanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCoursePerformance(courseId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setLoadError(err?.message ?? "Could not load performance data."); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <p className="text-sm text-muted-foreground">Loading performance dashboard…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError ?? "Course not found."}
        </div>
      </div>
    );
  }

  const { code, name, credits, enrolled, avg_attendance, avg_marks, total_marks, students } = data;

  const attendanceBuckets = bucketize(students.map((s) => s.attendance_pct), [
    ["<70%", 0, 70], ["70-80%", 70, 80], ["80-90%", 80, 90], ["90-100%", 90, 101],
  ]);
  const marksBuckets = bucketize(students.map((s) => s.marks_total), [
    ["0-25%", 0, total_marks * 0.25],
    ["25-50%", total_marks * 0.25, total_marks * 0.5],
    ["50-75%", total_marks * 0.5, total_marks * 0.75],
    ["75-100%", total_marks * 0.75, total_marks + 1],
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{code}</div>
          <h2 className="font-display text-xl font-bold">{name} · Performance Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={enrolled} icon={Award} tone="primary" />
        <StatCard label="Average Attendance" value={`${avg_attendance}%`} icon={TrendingUp} tone="success" />
        <StatCard label="Average Marks" value={`${avg_marks}/${total_marks}`} icon={Award} tone="accent" />
        <StatCard label="Course" value={code} icon={Award} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Attendance Graph</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
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
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="count" fill="#293681" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Course Statistics</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Enrolled" value={enrolled} />
            <MiniStat label="Credit Hours" value={credits} />
            <MiniStat label="Avg Attendance" value={`${avg_attendance}%`} />
            <MiniStat label="Avg Marks" value={`${avg_marks}/${total_marks}`} />
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