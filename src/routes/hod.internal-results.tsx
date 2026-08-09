import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Save, Search, Send } from "lucide-react";
import { authHeader } from "@/lib/auth";
import { sections, sectionLabel } from "@/features/HoD/lib/hod-mock-data";

export const Route = createFileRoute("/hod/internal-results")({
  head: () => ({ meta: [{ title: "Internal Results · HOD" }] }),
  component: InternalResults,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";
const SEMESTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

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

type HodCourse = {
  id: string; code: string; name: string; credits: number; sem: number;
  section: string; teacher_id: number | null; teacher_name: string | null; enrolled: number;
};

type MarkFields = {
  p_att: number; p_lab: number; p_exam: number; p_viva: number;
  t_att: number; t_assign: number; t_present: number; t_assess: number;
};

type MarkRow = MarkFields & {
  student_id: string; name: string; enrollment: string; status: "draft" | "published";
};

function InternalResults() {
  const [courses, setCourses] = useState<HodCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sem, setSem] = useState<string>("all");
  const [section, setSection] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
        const json = await res.json();
        if (!cancelled) setCourses(json);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const bySem = sem === "all" || String(c.sem) === sem;
      const bySection = section === "all" || c.section.toUpperCase() === section.toUpperCase();
      const byQuery = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      return bySem && bySection && byQuery;
    });
  }, [courses, query, sem, section]);

  if (courseId) {
    const course = courses.find((c) => c.id === courseId) ?? null;
    return <CourseMarks courseId={courseId} course={course} onBack={() => setCourseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Internal Results</h1>
        <p className="text-sm text-muted-foreground">
          Review the internal marks each teacher entered, adjust anything that needs correcting,
          then publish per course. Publishing here is what makes marks visible to students.
        </p>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course code or name…"
              className="rounded-xl pl-9"
            />
          </div>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTER_NUMBERS.map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => <SelectItem key={s} value={s}>Section {sectionLabel(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {courses.length === 0 ? "No courses in your department yet." : "No courses match the selected filters."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              onClick={() => setCourseId(c.id)}
              className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
            >
              <div className="gradient-brand relative h-20 p-4 text-white">
                <div className="text-[10px] uppercase tracking-widest opacity-80">{c.code}</div>
                <div className="mt-1 font-display text-base font-bold">{c.name}</div>
              </div>
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-full">Sem {c.sem}</Badge>
                  <Badge variant="secondary" className="rounded-full">Sec {c.section}</Badge>
                  {c.teacher_name && <Badge variant="secondary" className="rounded-full">{c.teacher_name}</Badge>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.enrolled} students</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Review marks <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseMarks({ courseId, course, onBack }: { courseId: string; course: HodCourse | null; onBack: () => void }) {
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const loadMarks = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/marks`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load marks (${res.status})`);
      setRows(await res.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load marks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMarks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courseId]);

  const update = (studentId: string, field: string, max: number, val: number) => {
    const clamped = Math.max(0, Math.min(max, Number.isFinite(val) ? val : 0));
    setRows((r) => r.map((x) => (x.student_id === studentId ? { ...x, [field]: clamped } : x)));
  };

  async function saveRows(currentRows: MarkRow[]) {
    const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/marks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        rows: currentRows.map(({ status, name, enrollment, ...fields }) => fields),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ?? `Failed to save (${res.status})`);
    }
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await saveRows(rows);
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save marks");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishOpen(false);
    setSaving(true);
    try {
      // publishing should reflect whatever's currently on screen, not just the last save
      await saveRows(rows);
      const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/marks/publish`, {
        method: "POST", headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`Failed to publish (${res.status})`);
      setRows((r) => r.map((x) => ({ ...x, status: "published" as const })));
      toast.success("Internal results published — students can now see this course's marks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish results");
    } finally {
      setSaving(false);
    }
  }

  const anyPublished = useMemo(() => rows.some((r) => r.status === "published"), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}>←</Button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course?.code ?? courseId}</div>
            <h2 className="font-display text-xl font-bold">{course?.name ?? "Course"} · Internal Results</h2>
          </div>
          {anyPublished && <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" disabled={saving || loading} onClick={saveDraft}>
            <Save className="mr-1.5 h-4 w-4" />Save Draft
          </Button>
          <Button className="rounded-xl" disabled={saving || loading} onClick={() => setPublishOpen(true)}>
            <Send className="mr-1.5 h-4 w-4" />Publish
          </Button>
        </div>
      </div>

      {course?.teacher_name && (
        <p className="text-xs text-muted-foreground">
          Entered by {course.teacher_name}. Any field below can be corrected before publishing.
        </p>
      )}

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
                    <th rowSpan={2} className="align-bottom text-center">Status</th>
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
                        <td className="text-center">
                          {s.status === "published"
                            ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published</Badge>
                            : <Badge variant="secondary" className="rounded-lg">Draft</Badge>}
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

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Internal Results?</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, internal marks for {course?.name ?? "this course"} will be visible to students.
              You can still edit and re-publish afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={publish}>Yes, Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}