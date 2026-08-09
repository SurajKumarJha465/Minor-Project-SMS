import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, TrendingUp, TrendingDown, Clock, ArrowRight } from "lucide-react";
import { authHeader } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/features/HoD/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/hod/marks")({
  head: () => ({ meta: [{ title: "Internal Marks Monitoring · HOD" }] }),
  component: Marks,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type CourseAverage = { code: string; name: string; avg: number };
type DistributionBucket = { range: string; count: number };
type TeacherStatus = { teacher_id: number; name: string; courses: number; entered: number; pending: number };
type MarksOverview = {
  avg: number;
  highest: number;
  highest_student: string | null;
  lowest: number;
  lowest_student: string | null;
  pending_courses: number;
  total_courses: number;
  course_averages: CourseAverage[];
  distribution: DistributionBucket[];
  teacher_status: TeacherStatus[];
};

function Marks() {
  const [data, setData] = useState<MarksOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/hod/marks/overview`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load marks overview (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load marks overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Internal Marks Monitoring</h1>
          <p className="text-sm text-muted-foreground">Department-wide internal assessment summary (published marks only).</p>
        </div>
        <Link to="/hod/internal-results" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90">
          Review &amp; Publish <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-1 py-10 text-center text-sm text-muted-foreground">Loading marks overview…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Avg Internal Marks" value={data.avg} delta="/100 (published)" icon={Award} tone="primary" />
            <StatCard label="Highest" value={data.highest} delta={data.highest_student ?? "—"} icon={TrendingUp} tone="success" />
            <StatCard label="Lowest" value={data.lowest} delta={data.lowest_student ?? "needs attention"} icon={TrendingDown} tone="warning" />
            <StatCard label="Pending Courses" value={data.pending_courses} delta={`of ${data.total_courses} courses`} icon={Clock} tone="accent" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl shadow-soft lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Course-wise Average Marks</CardTitle></CardHeader>
              <CardContent className="h-72">
                {data.course_averages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No published marks yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.course_averages.map((c) => ({ name: c.code, avg: c.avg }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                      <Bar dataKey="avg" fill="#4274D9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-soft">
              <CardHeader className="pb-2"><CardTitle className="text-base">Marks Distribution</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribution}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                    <Bar dataKey="count" fill="#293681" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="pb-2"><CardTitle className="text-base">Teacher-wise Entry Status</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Teacher</th>
                      <th className="px-4 py-3 text-left">Courses</th>
                      <th className="px-4 py-3 text-left">Published</th>
                      <th className="px-4 py-3 text-left">Pending</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teacher_status.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No teachers with assigned courses.</td></tr>
                    )}
                    {data.teacher_status.map((t) => (
                      <tr key={t.teacher_id} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{t.name}</td>
                        <td className="px-4 py-3">{t.courses}</td>
                        <td className="px-4 py-3 text-emerald-600 font-mono">{t.entered}</td>
                        <td className="px-4 py-3 text-destructive font-mono">{t.pending}</td>
                        <td className="px-4 py-3">
                          {t.pending === 0
                            ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Complete</Badge>
                            : <Badge className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">Pending</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}