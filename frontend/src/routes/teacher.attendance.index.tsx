import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ArrowRight } from "lucide-react";
import {
  getTeacherCourses,
  getTeacherDepartments,
  deptName,
  sectionLabel,
  semesters,
  sections,
  type TeacherCourse,
  type TeacherDepartmentDto,
} from "@/features/Teacher/lib/academic-data";

export const Route = createFileRoute("/teacher/attendance/")({
  head: () => ({ meta: [{ title: "Attendance · Teacher Portal" }] }),
  component: AttendanceIndex,
});

function AttendanceIndex() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDepartments, setMyDepartments] = useState<TeacherDepartmentDto[]>([]);

  const [dept, setDept] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [section, setSection] = useState<string>("all");

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

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const parsed = c.section ?? c.id.split("-")[2] ?? "d";
      const byDept = dept === "all" || c.dept === dept;
      const bySem = sem === "all" || String(c.sem) === sem;
      const bySection = section === "all" || parsed === section;
      return byDept && bySem && bySection;
    });
  }, [courses, dept, sem, section]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground">Choose filters and take attendance from your assigned courses.</p>
        </div>
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
              <Card key={c.id} className="group rounded-2xl border-border/60 shadow-soft transition hover:-translate-y-1 hover:shadow-glass">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{c.code}</div>
                    <CardTitle className="mt-1 truncate text-base">{c.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="rounded-full">{c.enrolled}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">{deptNameById.get(c.dept) ?? deptName(c.dept)}</Badge>
                    <Badge variant="secondary" className="rounded-full">Semester {c.sem}</Badge>
                    <Badge variant="secondary" className="rounded-full">Section {sectionLabel(sec)}</Badge>
                  </div>
                  <Link to="/teacher/attendance/$courseId" params={{ courseId: c.id }}>
                    <Button className="w-full rounded-xl">
                      <Camera className="mr-2 h-4 w-4" /> Take Attendance
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}