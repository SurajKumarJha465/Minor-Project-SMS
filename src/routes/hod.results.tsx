import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, TrendingUp, AlertCircle, ListChecks } from "lucide-react";
import { authHeader } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/features/HoD/components/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/hod/results")({
  head: () => ({ meta: [{ title: "Result Monitoring · HOD" }] }),
  component: Results,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";
const pieColors = ["#10B981", "#EF4444"];

type CoursePassFail = { code: string; passed: number; failed: number };
type RankedStudent = { id: string; name: string; enrollment: string; semester: number; photo: string | null; percentage: number };
type ResultsOverview = {
  avg_percentage: number;
  pass_percentage: number;
  fail_percentage: number;
  pass_fail_by_course: CoursePassFail[];
  top_students: RankedStudent[];
  at_risk_students: RankedStudent[];
};

function Results() {
  const [data, setData] = useState<ResultsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/hod/marks/results`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load results overview (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load results overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const passFail = data ? [
    { name: "Pass", value: data.pass_percentage },
    { name: "Fail", value: data.fail_percentage },
  ] : [];

  const publishedCourseCount = data?.pass_fail_by_course.length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Result Monitoring</h1>
        <p className="text-sm text-muted-foreground">Department pass ratios and student performance (published internal marks only).</p>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-1 py-10 text-center text-sm text-muted-foreground">Loading results overview…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Department Avg" value={`${data.avg_percentage}%`} delta="internal marks" icon={Award} tone="primary" />
            <StatCard label="Pass %" value={`${data.pass_percentage}%`} icon={TrendingUp} tone="success" />
            <StatCard label="Fail %" value={`${data.fail_percentage}%`} icon={AlertCircle} tone="warning" />
            <StatCard label="Published Courses" value={publishedCourseCount} delta="have results in" icon={ListChecks} tone="accent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader className="pb-2"><CardTitle className="text-base">Pass vs Fail</CardTitle></CardHeader>
              <CardContent className="h-64">
                {publishedCourseCount === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No published results yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={passFail} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {passFail.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-soft lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Course-wise Results</CardTitle></CardHeader>
              <CardContent className="h-64">
                {publishedCourseCount === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No published results yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.pass_fail_by_course.map((c) => ({ name: c.code, pass: c.passed, fail: c.failed }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="pass" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="fail" stackId="a" fill="#EF4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StudentList title="Top Performing Students" students={data.top_students} tone="success" />
            <StudentList title="Students at Risk" students={data.at_risk_students} tone="danger" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function StudentList({ title, students, tone }: { title: string; students: RankedStudent[]; tone: "success" | "danger" }) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {students.length === 0 && (
          <div className="px-1 py-6 text-center text-sm text-muted-foreground">
            {tone === "success" ? "No published results yet." : "No students below the pass threshold."}
          </div>
        )}
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
            <Avatar className="h-9 w-9"><AvatarImage src={s.photo ?? undefined} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">Sem {s.semester} · {s.enrollment}</div>
            </div>
            <Badge className={`rounded-lg ${tone === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive"}`}>
              {s.percentage}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}