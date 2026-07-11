import { createFileRoute } from "@tanstack/react-router";
import { Award, TrendingUp, AlertCircle, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { atRiskStudents, gpaTrend, passFail, topStudents, hodCourses } from "@/lib/hod-mock-data";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/hod/results")({
  head: () => ({ meta: [{ title: "Result Monitoring · HOD" }] }),
  component: Results,
});

const pieColors = ["#10B981", "#EF4444"];

function Results() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Result Monitoring</h1>
        <p className="text-sm text-muted-foreground">Department GPA, pass ratios and student performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Department GPA" value="3.42" delta="/ 4.0" icon={Award} tone="primary" />
        <StatCard label="Pass %" value="88%" delta="+3%" icon={TrendingUp} tone="success" />
        <StatCard label="Fail %" value="12%" delta="-3%" icon={AlertCircle} tone="warning" />
        <StatCard label="Predicted GPA" value="3.51" delta="next term" icon={PieIcon} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">GPA Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="term" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[2.8, 3.8]} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Line type="monotone" dataKey="gpa" stroke="#4274D9" strokeWidth={3} dot={{ r: 5, fill: "#293681" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Pass vs Fail</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={passFail} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {passFail.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-3">
          <CardHeader className="pb-2"><CardTitle className="text-base">Course-wise Results</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hodCourses.map(c => ({ name: c.code, pass: 75 + ((c.enrolled * 3) % 22), fail: 25 - ((c.enrolled * 3) % 22) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pass" stackId="a" fill="#10B981" radius={[0,0,0,0]} />
                <Bar dataKey="fail" stackId="a" fill="#EF4444" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudentList title="Top Performing Students" students={topStudents} tone="success" />
        <StudentList title="Students at Risk" students={atRiskStudents} tone="danger" />
      </div>
    </div>
  );
}

function StudentList({ title, students, tone }: { title: string; students: typeof topStudents; tone: "success" | "danger" }) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
            <Avatar className="h-9 w-9"><AvatarImage src={s.photo} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">Sem {s.semester} · {s.enrollment}</div>
            </div>
            <Badge className={`rounded-lg ${tone === "success" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive"}`}>
              GPA {s.gpa}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
