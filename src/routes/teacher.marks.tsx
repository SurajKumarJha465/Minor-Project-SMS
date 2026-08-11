import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save, ArrowRight, ArrowLeft, FileBarChart, Download, FileSpreadsheet, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import {
  getTeacherCourses, getCourseMarks, saveCourseMarks, getTeacherDepartments, getRosterForCourse,
  downloadCourseMarksReport,
  deptName, sectionLabel, semesters, sections,
  type TeacherCourse, type MarkRow, type MarkFields, type TeacherDepartmentDto,
} from "@/features/Teacher/lib/academic-data";

export const Route = createFileRoute("/teacher/marks")({
  head: () => ({ meta: [{ title: "Internal Marks · Teacher Portal" }] }),
  validateSearch: (search: Record<string, unknown>): { courseId?: string } => ({
    courseId: typeof search.courseId === "string" ? search.courseId : undefined,
  }),
  component: MarksPage,
});

const PRACTICAL = [
  { key: "p_att", label: "Attendance & Participation", max: 2 },
  { key: "p_lab", label: "Lab / Project Report", max: 4 },
  { key: "p_exam", label: "Practical Exam / Project Work", max: 8 },
  { key: "p_viva", label: "Viva", max: 6 },
] as const;

const THEORY = [
  { key: "t_att", label: "Attendance & Participation", max: 3 },
  { key: "t_assign", label: "Assignment", max: 6 },
  { key: "t_present", label: "Presentation", max: 3 },
  { key: "t_assess", label: "Internal Assessment", max: 18 },
] as const;

const ALL_FIELDS = [...PRACTICAL, ...THEORY];

function MarksPage() {
  const { courseId: initialCourseId } = Route.useSearch();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(initialCourseId ?? null);
  const [reportCourseId, setReportCourseId] = useState<string | null>(null);
  const [myDepartments, setMyDepartments] = useState<TeacherDepartmentDto[]>([]);

  const [dept, setDept] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [section, setSection] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherCourses()
      .then((list) => { if (!cancelled) setCourses(list); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
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

  if (courseId) {
    const course = courses.find((c) => c.id === courseId) ?? null;
    return <StudentMarks courseId={courseId} course={course} onBack={() => setCourseId(null)} />;
  }

  if (reportCourseId) {
    const course = courses.find((c) => c.id === reportCourseId) ?? null;
    return <InternalMarksReport courseId={reportCourseId} course={course} onBack={() => setReportCourseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Internal Marks</h1>
        <p className="text-sm text-muted-foreground">Select a course to enter marks. Maximum 50 marks per student.</p>
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
              <Card
                key={c.id}
                onClick={() => setCourseId(c.id)}
                className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="gradient-brand relative h-20 p-4 text-white">
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{c.code}</div>
                  <div className="mt-1 font-display text-base font-bold">{c.name}</div>
                </div>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-full">{deptNameById.get(c.dept) ?? deptName(c.dept)}</Badge>
                    <Badge variant="secondary" className="rounded-full">Sem {c.sem}</Badge>
                    <Badge variant="secondary" className="rounded-full">Sec {sectionLabel(sec)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.enrolled} students</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      Enter marks <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={(e) => { e.stopPropagation(); setReportCourseId(c.id); }}
                  >
                    <FileBarChart className="mr-1.5 h-4 w-4" />Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Row = MarkFields & { student_id: string; name: string; enrollment: string; status: "draft" | "published" };

function StudentMarks({ courseId, course, onBack }: { courseId: string; course: TeacherCourse | null; onBack: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCourseMarks(courseId)
      .then((data) => { if (!cancelled) setRows(data as Row[]); })
      .catch((err) => { if (!cancelled) setLoadError(err?.message ?? "Could not load marks."); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [courseId]);

  const update = (studentId: string, field: string, max: number, val: number) => {
    const clamped = Math.max(0, Math.min(max, Number.isFinite(val) ? val : 0));
    setRows((r) => r.map((x) => (x.student_id === studentId ? { ...x, [field]: clamped } : x)));
  };

  async function saveDraft() {
    setSaving(true);
    try {
      await saveCourseMarks(courseId, rows.map(({ status, name, enrollment, ...fields }) => fields));
      toast.success("Draft Saved Successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save marks");
    } finally {
      setSaving(false);
    }
  }

  const anyPublished = rows.some((r) => r.status === "published");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>←</Button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course?.code ?? courseId}</div>
            <h2 className="font-display text-xl font-bold">{course?.name ?? "Course"} · Internal Marks</h2>
          </div>
          {anyPublished
            ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published by HOD</Badge>
            : <Badge variant="secondary" className="rounded-lg">Awaiting HOD review</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" disabled={saving || loading} onClick={saveDraft}>
            <Save className="mr-1.5 h-4 w-4" />Save Draft
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Marks are saved here as a draft. Your HOD reviews and publishes them — that's the step
        that makes them visible to students.
      </p>

      {loadError && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{loadError}</div>
      )}

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Practical (20) · Theory (30) · Total (50)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading roster…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                    <th rowSpan={2} className="align-bottom">Student</th>
                    <th colSpan={4} className="text-center">Practical (20)</th>
                    <th colSpan={4} className="text-center">Theory (30)</th>
                    <th rowSpan={2} className="align-bottom text-center">Practical<br />Total</th>
                    <th rowSpan={2} className="align-bottom text-center">Theory<br />Total</th>
                    <th rowSpan={2} className="align-bottom text-center">Final /50</th>
                  </tr>
                  <tr className="[&>th]:px-2 [&>th]:pb-2 [&>th]:text-center">
                    {PRACTICAL.map((f) => <th key={f.key} title={f.label}>{f.max}</th>)}
                    {THEORY.map((f) => <th key={f.key} title={f.label}>{f.max}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((s) => {
                    const practicalTotal = PRACTICAL.reduce((sum, f) => sum + (s as any)[f.key], 0);
                    const theoryTotal = THEORY.reduce((sum, f) => sum + (s as any)[f.key], 0);
                    const final = practicalTotal + theoryTotal;
                    return (
                      <tr key={s.student_id} className="[&>td]:px-2 [&>td]:py-2">
                        <td className="px-3">
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.enrollment}</div>
                        </td>
                        {ALL_FIELDS.map((f) => (
                          <td key={f.key}>
                            <Input
                              type="number"
                              min={0}
                              max={f.max}
                              value={(s as any)[f.key]}
                              onChange={(e) => update(s.student_id, f.key, f.max, Number(e.target.value))}
                              className="h-9 w-14 rounded-lg text-center"
                            />
                          </td>
                        ))}
                        <td className="text-center font-mono text-sm font-semibold">{practicalTotal}</td>
                        <td className="text-center font-mono text-sm font-semibold">{theoryTotal}</td>
                        <td className="text-center">
                          <span className="rounded-lg bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">{final}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={ALL_FIELDS.length + 4} className="px-4 py-6 text-center text-sm text-muted-foreground">No students enrolled in this course yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InternalMarksReport({ courseId, course, onBack }: { courseId: string; course: TeacherCourse | null; onBack: () => void }) {
  const [rosterCount, setRosterCount] = useState<number | null>(course?.enrolled ?? null);
  const [generated, setGenerated] = useState(false);
  const [successKind, setSuccessKind] = useState<"excel" | "pdf" | null>(null);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRosterForCourse(courseId).then((roster) => {
      if (!cancelled) setRosterCount(roster.length);
    });
    return () => { cancelled = true; };
  }, [courseId]);

  async function download(kind: "excel" | "pdf") {
    setDownloading(kind);
    try {
      await downloadCourseMarksReport(courseId, kind === "excel" ? "xlsx" : "pdf");
      setSuccessKind(kind);
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to generate ${kind === "excel" ? "Excel" : "PDF"} report`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* ...header unchanged... */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-brand text-white"><FileBarChart className="h-5 w-5" /></div>
          <div className="min-w-0">
            <CardTitle className="text-base">Internal Marks Report</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {rosterCount ?? "…"} students · {course?.code ?? courseId} · {course ? deptName(course.dept) : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!generated ? (
            <Button className="rounded-xl" onClick={() => setGenerated(true)}>
              <FileBarChart className="mr-1.5 h-4 w-4" />Generate Report
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl" disabled={downloading !== null} onClick={() => download("excel")}>
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                {downloading === "excel" ? "Generating…" : "Download Excel"}
              </Button>
              <Button variant="outline" className="rounded-xl" disabled={downloading !== null} onClick={() => download("pdf")}>
                <Download className="mr-1.5 h-4 w-4" />
                {downloading === "pdf" ? "Generating…" : "Download PDF"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!successKind} onOpenChange={(v) => !v && setSuccessKind(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-emerald-500" />
              {successKind === "excel" ? "Excel report generated" : "PDF report generated"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {course?.name ?? "This course"} internal marks report has been downloaded as {successKind === "excel" ? ".xlsx" : ".pdf"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessKind(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}