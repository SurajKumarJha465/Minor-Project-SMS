import { createFileRoute } from "@tanstack/react-router";
import { Award, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { hodCourses, teachers } from "@/lib/hod-mock-data";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/hod/marks")({
  head: () => ({ meta: [{ title: "Internal Marks Monitoring · HOD" }] }),
  component: Marks,
});

function Marks() {
  const distribution = [
    { range: "0-40", count: 8 },
    { range: "40-55", count: 34 },
    { range: "55-70", count: 128 },
    { range: "70-85", count: 224 },
    { range: "85-100", count: 96 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Internal Marks Monitoring</h1>
        <p className="text-sm text-muted-foreground">Department-wide internal assessment summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Avg Internal Marks" value="78.4" delta="/100" icon={Award} tone="primary" />
        <StatCard label="Highest" value={98} delta="Anisha K." icon={TrendingUp} tone="success" />
        <StatCard label="Lowest" value={31} delta="needs attention" icon={TrendingDown} tone="warning" />
        <StatCard label="Pending Evaluations" value={11} delta="12 courses" icon={Clock} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Course-wise Average Marks</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hodCourses.map(c => ({ name: c.code, avg: 65 + ((c.enrolled * 5) % 25) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0,100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="avg" fill="#4274D9" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Marks Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="count" fill="#293681" radius={[8,8,0,0]} />
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
                  <th className="px-4 py-3 text-left">Entered</th>
                  <th className="px-4 py-3 text-left">Pending</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.slice(0, 10).map((t, i) => {
                  const entered = t.courses - (i % 2);
                  const pending = t.courses - entered;
                  return (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3">{t.courses}</td>
                      <td className="px-4 py-3 text-emerald-600 font-mono">{entered}</td>
                      <td className="px-4 py-3 text-destructive font-mono">{pending}</td>
                      <td className="px-4 py-3">
                        {pending === 0
                          ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Complete</Badge>
                          : <Badge className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">Pending</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
