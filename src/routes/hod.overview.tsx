import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, GraduationCap, BookOpen, CalendarRange, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hod } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/overview")({
  head: () => ({ meta: [{ title: "Department Overview · HOD" }] }),
  component: Overview,
});

function Overview() {
  const stats = [
    { label: "Teachers", value: 34, icon: Users },
    { label: "Students", value: 612, icon: GraduationCap },
    { label: "Courses", value: 42, icon: BookOpen },
    { label: "Semesters", value: 8, icon: CalendarRange },
  ];
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl border-0 gradient-brand text-white shadow-glass">
        <div className="grid gap-6 p-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 backdrop-blur-md">
            <Building2 className="h-10 w-10" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/80">Department</div>
            <h1 className="font-display text-3xl font-bold">{hod.department}</h1>
            <p className="mt-1 text-sm text-white/85">{hod.college} · {hod.session}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl shadow-soft">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="mt-1 font-display text-3xl font-bold">{s.value}</div>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Department Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row k="Head of Department" v={`${hod.title} ${hod.name}`} />
            <Row k="Qualification" v={hod.qualification} />
            <Row k="Experience" v={hod.experience} />
            <Row k="Academic Session" v={hod.session} />
            <Row k="College" v={hod.college} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} k="Email" v={hod.email} />
            <Row icon={Phone} k="Phone" v={hod.phone} />
            <Row icon={MapPin} k="Office" v={hod.office} />
            <Row icon={Clock} k="Office Hours" v={hod.officeHours} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v, icon: Icon }: { k: string; v: string; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{k}</span>
      </div>
      <div className="text-right font-medium">{v}</div>
    </div>
  );
}
