import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarRange, BookOpen, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";
import { sectionLabel } from "@/features/HoD/lib/hod-mock-data";

export const Route = createFileRoute("/hod/semesters")({
  head: () => ({ meta: [{ title: "Semester Management · HOD" }] }),
  component: Semesters,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";
const SEMESTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

type StudentRow = { id: string; semester: number };
type CourseRow = { id: string; code: string; name: string; sem: number; section: string; teacher_name: string | null };

function Semesters() {
  const [department, setDepartment] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewSem, setViewSem] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [meRes, studentsRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/api/hod/me`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/students`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } }),
        ]);
        if (!meRes.ok) throw new Error(`Failed to load department info (${meRes.status})`);
        if (!studentsRes.ok) throw new Error(`Failed to load students (${studentsRes.status})`);
        if (!coursesRes.ok) throw new Error(`Failed to load courses (${coursesRes.status})`);

        const [meData, studentsData, coursesData] = await Promise.all([
          meRes.json(), studentsRes.json(), coursesRes.json(),
        ]);

        if (!cancelled) {
          setDepartment(meData.department ?? "");
          setStudents(studentsData);
          setCourses(coursesData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load semesters.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const bySemester = useMemo(() => {
    const map = new Map<number, { students: number; courses: CourseRow[] }>();
    for (const n of SEMESTER_NUMBERS) map.set(n, { students: 0, courses: [] });
    for (const s of students) {
      const entry = map.get(s.semester);
      if (entry) entry.students += 1;
    }
    for (const c of courses) {
      const entry = map.get(c.sem);
      if (entry) entry.courses.push(c);
    }
    return map;
  }, [students, courses]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading semesters…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const viewData = viewSem ? bySemester.get(viewSem) : null;
  const viewTeachers = viewData
    ? Array.from(new Set(viewData.courses.map((c) => c.teacher_name).filter((t): t is string => !!t)))
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Semester Management</h1>
        <p className="text-sm text-muted-foreground">View department semesters, courses and assigned teachers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SEMESTER_NUMBERS.map((n) => {
          const data = bySemester.get(n)!;
          return (
            <Card key={n} className="rounded-2xl shadow-soft">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  {data.students > 0
                    ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Active</Badge>
                    : <Badge variant="secondary" className="rounded-lg">No students yet</Badge>}
                </div>
                <div>
                  <div className="font-display text-lg font-bold">Semester {n}</div>
                  <div className="text-xs text-muted-foreground">{department}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> {data.courses.length} courses</div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {data.students} students</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setViewSem(n)}>
                    <Eye className="mr-1 h-3 w-3" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!viewSem} onOpenChange={(o) => !o && setViewSem(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          {viewSem && viewData && (
            <>
              <DialogHeader>
                <DialogTitle>Semester {viewSem}</DialogTitle>
                <DialogDescription>{department}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Row label="Semester Number" value={String(viewSem)} />
                <Row label="Department" value={department} />
                <Row label="Total Students" value={String(viewData.students)} />
                <Row label="Total Courses" value={String(viewData.courses.length)} />
                <Row label="Assigned Teachers" value={viewTeachers.length ? viewTeachers.join(", ") : "None"} />
                <div>
                  <div className="mb-1.5 text-muted-foreground">Course List</div>
                  <ul className="space-y-1.5 rounded-xl border border-border/60 p-3">
                    {viewData.courses.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{c.name} <span className="text-muted-foreground">({c.code} · Sec {sectionLabel(c.section)})</span></span>
                        <span className="text-muted-foreground">{c.teacher_name ?? "Unassigned"}</span>
                      </li>
                    ))}
                    {viewData.courses.length === 0 && <li className="text-xs text-muted-foreground">No courses yet.</li>}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewSem(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}