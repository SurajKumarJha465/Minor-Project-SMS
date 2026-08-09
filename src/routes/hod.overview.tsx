import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Users, GraduationCap, BookOpen, CalendarRange, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/overview")({
  head: () => ({ meta: [{ title: "Department Overview · HOD" }] }),
  component: Overview,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";
const SEMESTER_COUNT = 8;

type HodProfile = {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string | null;
  qualification: string | null;
  experience: string | null;
  photo: string | null;
};

function Overview() {
  const [hod, setHod] = useState<HodProfile | null>(null);
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [meRes, studentsRes, coursesRes, teachersRes] = await Promise.all([
          fetch(`${API_URL}/api/hod/me`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/students`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/teachers`, { headers: { ...authHeader() } }),
        ]);
        if (!meRes.ok) throw new Error(`Failed to load department info (${meRes.status})`);
        if (!studentsRes.ok) throw new Error(`Failed to load students (${studentsRes.status})`);
        if (!coursesRes.ok) throw new Error(`Failed to load courses (${coursesRes.status})`);
        if (!teachersRes.ok) throw new Error(`Failed to load teachers (${teachersRes.status})`);

        const [meData, studentsData, coursesData, teachersData] = await Promise.all([
          meRes.json(), studentsRes.json(), coursesRes.json(), teachersRes.json(),
        ]);

        if (!cancelled) {
          setHod(meData);
          setStudentCount(studentsData.length);
          setCourseCount(coursesData.length);
          setTeacherCount(teachersData.length);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load department overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading department overview…
      </div>
    );
  }

  if (loadError || !hod) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError ?? "Department overview unavailable."}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = [
    { label: "Teachers", value: teacherCount, icon: Users },
    { label: "Students", value: studentCount, icon: GraduationCap },
    { label: "Courses", value: courseCount, icon: BookOpen },
    { label: "Semesters", value: SEMESTER_COUNT, icon: CalendarRange },
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
            <Row k="Head of Department" v={hod.name} />
            <Row k="Qualification" v={hod.qualification ?? "—"} />
            <Row k="Experience" v={hod.experience ?? "—"} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} k="Email" v={hod.email} />
            <Row icon={Phone} k="Phone" v={hod.phone ?? "—"} />
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