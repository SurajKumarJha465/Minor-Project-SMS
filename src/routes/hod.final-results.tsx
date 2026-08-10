import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, Save, Send, Upload } from "lucide-react";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/final-results")({
  head: () => ({ meta: [{ title: "Final Results · HOD" }] }),
  component: FinalResults,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Same scale as backend/api/grading.py (Pokhara University's 4.0 system).
// Keep these two in sync if the grading scale ever changes.
const GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

type HodCourse = {
  id: string; code: string; name: string; credits: number; sem: number;
  section: string; teacher_id: number | null; teacher_name: string | null; enrolled: number;
};

type GradeRow = { student_id: string; name: string; enrollment: string; grade: string; status: "draft" | "published" };

type SemesterCourseSummary = {
  course_id: string; code: string; name: string; section: string;
  graded: number; total_enrolled: number; published: boolean;
};

function FinalResults() {
  const [courses, setCourses] = useState<HodCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);

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

  if (courseId) {
    const course = courses.find((c) => c.id === courseId) ?? null;
    return <CourseGrades courseId={courseId} course={course} onBack={() => setCourseId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Final Results</h1>
        <p className="text-sm text-muted-foreground">
          Publish the university's end-semester results — upload one sheet for a whole semester, or
          enter/import grades course by course below. This is separate from internal marks — teachers
          don't have access to this.
        </p>
      </div>

      <SemesterImport onOpenCourse={setCourseId} />

      <div className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">Browse by Course</h2>
          <p className="text-xs text-muted-foreground">Enter or import grades for a single course manually.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses in your department yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
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
                      Enter results <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SemesterImport({ onOpenCourse }: { onOpenCourse: (courseId: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [sem, setSem] = useState<number>(1);
  const [summary, setSummary] = useState<SemesterCourseSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [importing, setImporting] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSummary = async (semester: number) => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/semesters/${semester}/results`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load semester summary (${res.status})`);
      const data = await res.json();
      setSummary(data.courses ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load semester summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => { loadSummary(sem); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sem]);

  async function importCsv(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/hod/semesters/${sem}/results/import-csv`, {
        method: "POST", headers: { ...authHeader() }, body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail ?? `Import failed (${res.status})`);
      toast.success(`Imported ${body.saved} result(s)${body.skipped?.length ? `, skipped ${body.skipped.length}` : ""}`);
      if (body.skipped?.length) {
        // handy when the sheet only covers some students/courses — makes it
        // obvious which rows didn't match anything without failing the import
        console.info("Skipped rows:", body.skipped);
      }
      await loadSummary(sem);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import CSV");
    } finally {
      setImporting(false);
    }
  }

  async function publishSemester() {
    setPublishOpen(false);
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/semesters/${sem}/results/publish`, {
        method: "POST", headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`Failed to publish (${res.status})`);
      toast.success(`Published semester ${sem} results — students can now see them`);
      await loadSummary(sem);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish semester results");
    } finally {
      setPublishing(false);
    }
  }

  const totalGraded = summary.reduce((n, c) => n + c.graded, 0);
  const allPublished = summary.length > 0 && summary.every((c) => c.graded === 0 || c.published);

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" /> Publish by Semester
          </CardTitle>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload one results sheet covering every course in a semester, then publish it all at once.
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(sem)} onValueChange={(v) => setSem(Number(v))}>
              <SelectTrigger className="h-9 w-32 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
              </SelectContent>
            </Select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" className="rounded-xl" disabled={importing} onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" />{importing ? "Importing…" : "Upload Result Sheet (CSV)"}
            </Button>

            <Button
              className="rounded-xl"
              disabled={publishing || totalGraded === 0 || allPublished}
              onClick={() => setPublishOpen(true)}
            >
              <Send className="mr-1.5 h-4 w-4" />
              {allPublished && totalGraded > 0 ? "All Published" : "Publish Semester"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            CSV needs <code>enrollment</code>, <code>course_code</code>, and <code>grade</code> columns — one row
            per student per course. A course code shared across sections resolves automatically from each
            student's own enrollment, so no section column is needed. Unmatched rows are skipped and reported,
            not treated as a failure.
          </p>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                  <th>Course</th>
                  <th>Section</th>
                  <th>Graded</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingSummary ? (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">Loading…</td></tr>
                ) : summary.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">No courses in semester {sem} yet.</td></tr>
                ) : (
                  summary.map((c) => (
                    <tr key={c.course_id} className="[&>td]:px-3 [&>td]:py-2">
                      <td>
                        <div className="text-sm font-semibold">{c.code}</div>
                        <div className="text-xs text-muted-foreground">{c.name}</div>
                      </td>
                      <td className="text-xs">{c.section}</td>
                      <td className="text-xs">{c.graded} / {c.total_enrolled}</td>
                      <td>
                        {c.graded === 0 ? (
                          <Badge variant="secondary" className="rounded-lg">No results yet</Badge>
                        ) : c.published ? (
                          <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-lg">Draft</Badge>
                        )}
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => onOpenCourse(c.course_id)}>
                          Review <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Semester {sem} Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This publishes every graded course in semester {sem} at once ({totalGraded} graded result{totalGraded === 1 ? "" : "s"}
              {" "}across {summary.filter((c) => c.graded > 0).length} course{summary.filter((c) => c.graded > 0).length === 1 ? "" : "s"}).
              Students will immediately be able to see this semester in their results. You can still edit and
              re-publish individual courses afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={publishSemester}>Yes, Publish Semester</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CourseGrades({ courseId, course, onBack }: { courseId: string; course: HodCourse | null; onBack: () => void }) {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGrades = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/grades`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load grades (${res.status})`);
      setRows(await res.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load grades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGrades(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courseId]);

  const setGrade = (studentId: string, grade: string) => {
    setRows((r) => r.map((x) => (x.student_id === studentId ? { ...x, grade } : x)));
  };

  async function saveRows(currentRows: GradeRow[]) {
    const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/grades`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ rows: currentRows.map(({ student_id, grade }) => ({ student_id, grade })) }),
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
      toast.error(err instanceof Error ? err.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishOpen(false);
    setSaving(true);
    try {
      // publishing should reflect whatever's on screen, not just the last save
      await saveRows(rows);
      const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/grades/publish`, {
        method: "POST", headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`Failed to publish (${res.status})`);
      setRows((r) => r.map((x) => ({ ...x, status: "published" as const })));
      toast.success("Results published — students can now see this course's grade");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish results");
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/grades/import-csv`, {
        method: "POST", headers: { ...authHeader() }, body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail ?? `Import failed (${res.status})`);
      toast.success(`Imported ${body.saved} row(s)${body.skipped?.length ? `, skipped ${body.skipped.length}` : ""}`);
      if (body.skipped?.length) {
        // most useful when you're only importing a handful of known results —
        // makes it obvious which rows in the CSV didn't match anything
        console.info("Skipped rows:", body.skipped);
      }
      await loadGrades();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import CSV");
    } finally {
      setImporting(false);
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
            <h2 className="font-display text-xl font-bold">{course?.name ?? "Course"} · Final Results</h2>
          </div>
          {anyPublished && <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv(file);
              e.target.value = "";
            }}
          />
          <Button variant="outline" className="rounded-xl" disabled={importing || loading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" />{importing ? "Importing…" : "Import CSV"}
          </Button>
          <Button variant="outline" className="rounded-xl" disabled={saving || loading} onClick={saveDraft}>
            <Save className="mr-1.5 h-4 w-4" />Save Draft
          </Button>
          <Button className="rounded-xl" disabled={saving || loading} onClick={() => setPublishOpen(true)}>
            <Send className="mr-1.5 h-4 w-4" />Publish
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        CSV needs <code>enrollment</code> and <code>grade</code> columns. Rows for students not enrolled here, or
        with an unrecognized grade, are skipped rather than failing the whole import — handy if you only have
        confirmed results for a few students rather than the full class.
      </p>

      {loadError && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{loadError}</div>
      )}

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" /> Student Roster</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading roster…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.student_id} className="[&>td]:px-3 [&>td]:py-2">
                      <td>
                        <div className="text-sm font-semibold">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.enrollment}</div>
                      </td>
                      <td>
                        <Select value={r.grade || "__none"} onValueChange={(v) => setGrade(r.student_id, v === "__none" ? "" : v)}>
                          <SelectTrigger className="h-9 w-24 rounded-lg"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">—</SelectItem>
                            {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        {r.status === "published"
                          ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Published</Badge>
                          : <Badge variant="secondary" className="rounded-lg">Draft</Badge>}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">No students enrolled in this course yet.</td></tr>
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
            <AlertDialogTitle>Publish Final Results?</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, results for {course?.name ?? "this course"} will be visible to students in their
              Semester Results. You can still edit and re-publish afterward.
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