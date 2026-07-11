import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, AlertTriangle, Clock, Download, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { deptAttendanceTrend, hodCourses, teachers } from "@/lib/hod-mock-data";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/hod/attendance")({
  head: () => ({ meta: [{ title: "Attendance Monitoring · HOD" }] }),
  component: Attendance,
});

function Attendance() {
  const byCourse = hodCourses.map((c) => ({ name: c.code, pct: 70 + ((c.enrolled * 7) % 25) }));
  const byTeacher = teachers.slice(0, 8).map((t) => ({ name: t.name.split(" ").slice(-1)[0], pct: 78 + ((t.courses * 13) % 18) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Attendance Monitoring</h1>
          <p className="text-sm text-muted-foreground">Live view of department-wide attendance.</p>
        </div>
        <Button variant="outline" className="rounded-xl"><Download className="mr-1.5 h-4 w-4" /> Download Report</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's Attendance" value="82%" delta="14/17 classes" icon={ClipboardCheck} tone="primary" />
        <StatCard label="Dept Attendance" value="86%" delta="6-week avg" icon={Users} tone="success" />
        <StatCard label="Low Attendance Alerts" value={9} delta="< 75%" icon={AlertTriangle} tone="warning" />
        <StatCard label="Pending Submission" value={2} delta="today" icon={Clock} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Attendance Trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deptAttendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="ML" stroke="#293681" fill="#29368133" strokeWidth={2} />
                <Area type="monotone" dataKey="DS" stroke="#4274D9" fill="#4274D933" strokeWidth={2} />
                <Area type="monotone" dataKey="ALG" stroke="#95CCDD" fill="#95CCDD44" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">By Course</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCourse}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="pct" fill="#4274D9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">By Teacher</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTeacher}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="pct" fill="#293681" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-base">Student Heatmap</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 60 }).map((_, i) => {
                const v = (i * 37) % 100;
                const color = v > 85 ? "bg-emerald-500" : v > 70 ? "bg-emerald-400" : v > 55 ? "bg-amber-400" : v > 40 ? "bg-orange-400" : "bg-red-400";
                return <div key={i} className={`aspect-square rounded-sm ${color} opacity-80`} title={`${v}%`} />;
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-1">
                {["bg-red-400","bg-orange-400","bg-amber-400","bg-emerald-400","bg-emerald-500"].map((c,i) => <div key={i} className={`h-2 w-4 rounded-sm ${c}`} />)}
              </div>
              <span>High</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
