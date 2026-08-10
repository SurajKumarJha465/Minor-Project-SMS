import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Layers, TrendingUp } from "lucide-react";
import { StatCard } from "@/features/Teacher/components/StatCard";
import {
  getTeacherCourses,
  getTeacherDepartments,
  getCoursePerformance,
  getCourseAggregatePerformance,
  groupTeacherCourses,
  deptName,
  sectionLabel,
  type TeacherCourse,
  type TeacherDepartmentDto,
  type CoursePerformanceDto,
  type CourseAggregatePerformanceDto,
  type GroupedTeacherCourse,
} from "@/features/Teacher/lib/academic-data";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/teacher/performance")({
  head: () => ({ meta: [{ title: "Student Performance · Teacher Portal" }] }),
  component: PerformancePage,
});

/**
 * Click hierarchy:
 *   1. CourseListLevel     — one card per course code (aggregated across every
 *                            section/semester the teacher teaches it in).
 *   2. AggregateLevel      — combined performance summary for that course code,
 *                            plus a picker for the individual offerings.
 *   3. PerformanceDashboard — the existing single-offering dashboard (unchanged).
 */
function PerformancePage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDepartments, setMyDepartments] = useState<TeacherDepartmentDto[]>([]);

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);

  const [dept, setDept] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherCourses()
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTeacherDepartments().then((list) => {
      if (!cancelled) setMyDepartments(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const deptNameById = useMemo(
    () => new Map(myDepartments.map((d) => [d.id, d.name])),
    [myDepartments],
  );

  const grouped = useMemo(() => groupTeacherCourses(courses), [courses]);

  const filteredGroups = useMemo(() => {
    if (dept === "all") return grouped;
    return grouped.filter((g) => g.dept === dept);
  }, [grouped, dept]);

  // Level 3: a specific section/semester offering was picked from the aggregate view.
  if (courseId) {
    return <PerformanceDashboard courseId={courseId} onBack={() => setCourseId(null)} />;
  }

  // Level 2: a course code was picked — show its combined performance + offering picker.
  if (selectedCode) {
    const group = grouped.find((g) => g.code === selectedCode) ?? null;
    return (
      <AggregateDashboard
        code={selectedCode}
        group={group}
        onBack={() => setSelectedCode(null)}
        onSelectOffering={(id) => setCourseId(id)}
      />
    );
  }

  // Level 1: course codes, grouped across all sections/semesters.
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Student Performance</h1>
        <p className="text-sm text-muted-foreground">
          Select one of your courses to view its combined performance across all sections and
          semesters.
        </p>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <select
            className="rounded-xl border bg-background p-2 text-sm"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {myDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : filteredGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No assigned courses found for selected filters.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((g) => {
            const totalEnrolled = courses
              .filter((c) => c.code === g.code)
              .reduce((sum, c) => sum + c.enrolled, 0);
            return (
              <Card
                key={g.code}
                onClick={() => setSelectedCode(g.code)}
                className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="gradient-brand relative h-20 p-4 text-white">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{g.code}</div>
                  <div className="mt-1 font-display text-base font-bold">{g.name}</div>
                </div>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-full">
                      {deptNameById.get(g.dept) ?? deptName(g.dept)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      <Layers className="mr-1 inline-block h-3 w-3" />
                      {g.offerings.length} section{g.offerings.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {totalEnrolled} students total
                    </span>
                    <span className="text-xs font-medium text-primary">
                      View combined performance →
                    </span>
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

function AggregateDashboard({
  code,
  group,
  onBack,
  onSelectOffering,
}: {
  code: string;
  group: GroupedTeacherCourse | null;
  onBack: () => void;
  onSelectOffering: (courseId: string) => void;
}) {
  const [data, setData] = useState<CourseAggregatePerformanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCourseAggregatePerformance(code)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message ?? "Could not load performance data.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">Loading combined performance…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError ?? "Course not found."}
        </div>
      </div>
    );
  }

  const { name, credits, enrolled, avg_attendance, avg_marks, total_marks, students, offerings } =
    data;

  const attendanceBuckets = bucketize(
    students.map((s) => s.attendance_pct),
    [
      ["<70%", 0, 70],
      ["70-80%", 70, 80],
      ["80-90%", 80, 90],
      ["90-100%", 90, 101],
    ],
  );
  const marksBuckets = bucketize(
    students.map((s) => s.marks_total),
    [
      ["0-25%", 0, total_marks * 0.25],
      ["25-50%", total_marks * 0.25, total_marks * 0.5],
      ["50-75%", total_marks * 0.5, total_marks * 0.75],
      ["75-100%", total_marks * 0.75, total_marks + 1],
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {code}
          </div>
          <h2 className="font-display text-xl font-bold">{name} · Combined Performance</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students (all sections)" value={enrolled} icon={Award} tone="primary" />
        <StatCard
          label="Average Attendance"
          value={`${avg_attendance}%`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Average Marks"
          value={`${avg_marks}/${total_marks}`}
          icon={Award}
          tone="accent"
        />
        <StatCard label="Sections/Semesters" value={offerings.length} icon={Layers} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Graph</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="count" fill="#4274D9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Internal Marks Graph</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="count" fill="#293681" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Course Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Enrolled" value={enrolled} />
            <MiniStat label="Credit Hours" value={credits} />
            <MiniStat label="Avg Attendance" value={`${avg_attendance}%`} />
            <MiniStat label="Avg Marks" value={`${avg_marks}/${total_marks}`} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold">Select a Section</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Pick an individual section/semester offering to view its own detailed dashboard.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offerings.map((o) => {
            const meta = group?.offerings.find((off) => off.id === o.id);
            return (
              <Card
                key={o.id}
                onClick={() => onSelectOffering(o.id)}
                className="group cursor-pointer rounded-2xl border-border/60 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
              >
                <CardContent className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-full">
                      Sem {meta?.sem ?? o.sem}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      Sec {sectionLabel(meta?.section ?? o.section)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{o.enrolled} students</span>
                    <span>{o.avg_attendance}% attendance</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Avg marks {o.avg_marks}/{total_marks}
                    </span>
                    <span className="text-xs font-medium text-primary">View dashboard →</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
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
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message ?? "Could not load performance data.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">Loading performance dashboard…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="space-y-4">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError ?? "Course not found."}
        </div>
      </div>
    );
  }

  const { code, name, credits, enrolled, avg_attendance, avg_marks, total_marks, students } = data;

  const attendanceBuckets = bucketize(
    students.map((s) => s.attendance_pct),
    [
      ["<70%", 0, 70],
      ["70-80%", 70, 80],
      ["80-90%", 80, 90],
      ["90-100%", 90, 101],
    ],
  );
  const marksBuckets = bucketize(
    students.map((s) => s.marks_total),
    [
      ["0-25%", 0, total_marks * 0.25],
      ["25-50%", total_marks * 0.25, total_marks * 0.5],
      ["50-75%", total_marks * 0.5, total_marks * 0.75],
      ["75-100%", total_marks * 0.75, total_marks + 1],
    ],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {code}
          </div>
          <h2 className="font-display text-xl font-bold">{name} · Performance Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={enrolled} icon={Award} tone="primary" />
        <StatCard
          label="Average Attendance"
          value={`${avg_attendance}%`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Average Marks"
          value={`${avg_marks}/${total_marks}`}
          icon={Award}
          tone="accent"
        />
        <StatCard label="Course" value={code} icon={Award} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Graph</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="count" fill="#4274D9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Internal Marks Graph</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Bar dataKey="count" fill="#293681" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Course Statistics</CardTitle>
          </CardHeader>
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