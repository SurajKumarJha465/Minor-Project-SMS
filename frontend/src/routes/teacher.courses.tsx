import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import {
  getTeacherCourses,
  getTeacherDepartments,
  sectionLabel,
  semesters,
  sections,
  type TeacherCourse,
  type TeacherDepartmentDto,
} from "@/features/Teacher/lib/academic-data";

export const Route = createFileRoute("/teacher/courses")({
  head: () => ({ meta: [{ title: "My Courses · Teacher Portal" }] }),
  component: CoursesPage,
});

function CoursesPage() {
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
      .then((list) => !cancelled && setCourses(list))
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
      const sec = c.section ?? c.id.split("-")[2] ?? "d";
      const byDept = dept === "all" || c.dept === dept;
      const bySem = sem === "all" || String(c.sem) === sem;
      const bySection = section === "all" || sec === section;
      return byDept && bySem && bySection;
    });
  }, [courses, dept, sem, section]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Your assigned backend courses.</p>
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
        <p className="text-sm text-muted-foreground">No courses found.</p>
      ) : (
        <div className="space-y-4">
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">{filtered.length} courses</Badge>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => {
              const sec = c.section ?? c.id.split("-")[2] ?? "d";
              const attendance = c.attendance ?? 0;
              return (
                <Card key={c.id} className="group overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass">
                  <div className="gradient-brand relative h-24 p-4 text-white">
                    <div className="text-[10px] uppercase tracking-widest opacity-80">{deptNameById.get(c.dept) ?? c.dept} · Sem {c.sem} · {sectionLabel(sec)}</div>
                    <div className="mt-1 font-display text-lg font-bold">{c.name}</div>
                    <div className="absolute right-4 top-4 rounded-lg bg-white/15 px-2 py-1 font-mono text-xs backdrop-blur">{c.code}</div>
                  </div>
                  <CardContent className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <Stat label="Credit Hours" value={c.credits} />
                      <Stat label="Enrolled" value={c.enrolled} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Attendance (placeholder)</span>
                        <span className="font-semibold">{attendance}%</span>
                      </div>
                      <Progress value={attendance} className="mt-1 h-1.5" />
                    </div>
                    <Button
                      size="sm"
                      className="w-full rounded-lg text-xs"
                      onClick={() => toast(`${c.name} · ${c.code} · ${c.credits} credit hours · ${c.enrolled} enrolled`)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold">{value}</div>
    </div>
  );
}