import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authHeader } from "@/lib/auth";
import {
  Eye, Pencil, UserX, BookOpen, UserPlus, ArrowLeft,
  CalendarRange, CheckCircle2, GraduationCap, Award, Clock, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/hod/teachers")({
  head: () => ({ meta: [{ title: "Teacher Management · HOD" }] }),
  component: TeacherManagement,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type Course = {
  id: string;
  code: string;
  name: string;
  credits: number;
  sem: number;
  section: string;
  teacherId: number | null;
  teacherName: string | null;
  enrolled: number;
};

type Teacher = {
  id: number;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experience: string | null;
  photo: string | null;
};

type GroupedCourse = {
  code: string;
  name: string;
  credits: number;
  sem: number;
  sections: Course[];
};

const SEMESTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

function mapCourse(c: any): Course {
  return {
    id: c.id, code: c.code, name: c.name, credits: c.credits, sem: c.sem,
    section: c.section, teacherId: c.teacher_id, teacherName: c.teacher_name,
    enrolled: c.enrolled ?? 0,
  };
}

// The same subject is offered as a separate Course row per section (e.g. "CS-301"
// exists once for Section D and once for Section M1). Group by code so the browse
// view shows one card per unique subject instead of one per section.
function groupByCode(list: Course[]): GroupedCourse[] {
  const map = new Map<string, GroupedCourse>();
  for (const c of list) {
    if (!map.has(c.code)) {
      map.set(c.code, { code: c.code, name: c.name, credits: c.credits, sem: c.sem, sections: [] });
    }
    map.get(c.code)!.sections.push(c);
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function TeacherManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);

  // Assign-teacher wizard state — Semester -> Section -> Course -> Teacher
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [wizSem, setWizSem] = useState<number | null>(null);
  const [wizSection, setWizSection] = useState<string | null>(null);
  const [wizCourseId, setWizCourseId] = useState<string | null>(null);
  const [wizTeacherId, setWizTeacherId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  // View / remove dialogs — act on a specific section-instance course row
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [removeCourse, setRemoveCourse] = useState<Course | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [cRes, tRes] = await Promise.all([
          fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/teachers`, { headers: { ...authHeader() } }),
        ]);
        if (!cRes.ok) throw new Error(`Failed to load courses (${cRes.status})`);
        if (!tRes.ok) throw new Error(`Failed to load teachers (${tRes.status})`);
        const cData = await cRes.json();
        const tData = await tRes.json();
        if (!cancelled) {
          setCourses(cData.map(mapCourse));
          setTeachers(tData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load teachers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Unique-subject count per semester (not raw section-row count), matching the
  // grouped browse view below.
  const semesterCourseCounts = useMemo(() => {
    const bySem = new Map<number, Set<string>>();
    for (const c of courses) {
      if (!bySem.has(c.sem)) bySem.set(c.sem, new Set());
      bySem.get(c.sem)!.add(c.code);
    }
    const counts = new Map<number, number>();
    for (const [sem, codes] of bySem) counts.set(sem, codes.size);
    return counts;
  }, [courses]);

  const semCourses = selectedSem ? courses.filter((c) => c.sem === selectedSem) : [];
  const groupedSemCourses = useMemo(() => groupByCode(semCourses), [semCourses]);

  const wizSections = useMemo(() => {
    if (!wizSem) return [];
    const set = new Set<string>();
    for (const c of courses) if (c.sem === wizSem) set.add(c.section);
    return Array.from(set).sort();
  }, [courses, wizSem]);

  const wizCoursesInSection = wizSem && wizSection
    ? courses.filter((c) => c.sem === wizSem && c.section === wizSection)
    : [];
  const wizCourse = courses.find((c) => c.id === wizCourseId) || null;
  const wizTeacher = teachers.find((t) => t.id === wizTeacherId) || null;

  // courseToEdit: jump straight to the Teacher step for one specific section-instance.
  // semHint: start the wizard pre-filled to a semester, at the Section step.
  function openAssignWizard(courseToEdit?: Course, semHint?: number) {
    if (courseToEdit) {
      setWizSem(courseToEdit.sem);
      setWizSection(courseToEdit.section);
      setWizCourseId(courseToEdit.id);
      setStep(4);
    } else if (semHint) {
      setWizSem(semHint);
      setWizSection(null);
      setWizCourseId(null);
      setStep(2);
    } else {
      setWizSem(selectedSem ?? null);
      setWizSection(null);
      setWizCourseId(null);
      setStep(selectedSem ? 2 : 1);
    }
    setWizTeacherId(null);
    setWizardOpen(true);
  }

  async function confirmAssign() {
    if (!wizCourseId || !wizTeacherId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${wizCourseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ teacher_id: wizTeacherId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to assign teacher");
        return;
      }
      const data = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === data.id ? mapCourse(data) : c)));
      setStep(5);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setAssigning(false);
    }
  }

  function closeWizard() {
    setWizardOpen(false);
    setStep(1);
    setWizSem(null);
    setWizSection(null);
    setWizCourseId(null);
    setWizTeacherId(null);
  }

  async function doRemoveTeacher() {
    if (!removeCourse) return;
    setRemoving(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${removeCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ unassign_teacher: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to remove teacher");
        return;
      }
      const data = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === data.id ? mapCourse(data) : c)));
      setRemoveCourse(null);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading teachers…
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Teacher Management</h1>
          <p className="text-sm text-muted-foreground">Assign faculty to courses across semesters.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => openAssignWizard()}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Assign Teacher
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">
              {selectedSem ? `Semester ${selectedSem} · Courses` : "Semesters"}
            </CardTitle>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <button
                onClick={() => setSelectedSem(null)}
                className={selectedSem ? "hover:text-primary hover:underline" : "font-semibold text-foreground"}
              >
                All Semesters
              </button>
              {selectedSem && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-foreground">Semester {selectedSem}</span>
                </>
              )}
            </div>
          </div>
          {selectedSem && (
            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setSelectedSem(null)}>
              <ArrowLeft className="mr-1 h-3 w-3" /> Back
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selectedSem && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
              {SEMESTER_NUMBERS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedSem(n)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div className="font-display text-sm font-bold">Semester {n}</div>
                  <div className="text-[11px] text-muted-foreground">{semesterCourseCounts.get(n) ?? 0} courses</div>
                </button>
              ))}
            </div>
          )}

          {selectedSem && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedSemCourses.map((g) => {
                const assignedCount = g.sections.filter((s) => s.teacherName).length;
                const totalCount = g.sections.length;
                return (
                  <Card key={g.code} className="rounded-2xl shadow-soft">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between">
                        <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        {assignedCount === totalCount ? (
                          <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">All Assigned</Badge>
                        ) : assignedCount === 0 ? (
                          <Badge className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">Unassigned</Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-lg">{assignedCount}/{totalCount} Assigned</Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-mono text-muted-foreground">{g.code}</div>
                        <div className="font-display text-base font-bold leading-tight">{g.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {g.credits} Credit Hours · {totalCount} section{totalCount === 1 ? "" : "s"}
                      </div>
                      <div className="space-y-1.5 border-t border-border/60 pt-3">
                        {g.sections.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <Badge variant="outline" className="shrink-0 rounded-md px-1.5 py-0 text-[10px]">{c.section}</Badge>
                              {c.teacherName ? (
                                <span className="truncate">{c.teacherName}</span>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-0.5">
                              <button onClick={() => setViewCourse(c)} aria-label="View" className="rounded p-1 text-muted-foreground hover:bg-muted">
                                <Eye className="h-3 w-3" />
                              </button>
                              <button onClick={() => openAssignWizard(c)} aria-label="Edit" className="rounded p-1 text-muted-foreground hover:bg-muted">
                                <Pencil className="h-3 w-3" />
                              </button>
                              {c.teacherName && (
                                <button onClick={() => setRemoveCourse(c)} aria-label="Remove teacher" className="rounded p-1 text-destructive hover:bg-destructive/10">
                                  <UserX className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {groupedSemCourses.length === 0 && (
                <div className="col-span-full py-6 text-center text-sm text-muted-foreground">No courses in this semester.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View course dialog */}
      <Dialog open={!!viewCourse} onOpenChange={(o) => !o && setViewCourse(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {viewCourse && (
            <>
              <DialogHeader>
                <DialogTitle>{viewCourse.name}</DialogTitle>
                <DialogDescription>{viewCourse.code} · Semester {viewCourse.sem} · Section {viewCourse.section}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Row label="Assigned Teacher" value={viewCourse.teacherName ?? "Unassigned"} />
                <Row label="Credit Hours" value={String(viewCourse.credits)} />
                <Row label="Students Enrolled" value={String(viewCourse.enrolled)} />
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewCourse(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove teacher confirmation */}
      <AlertDialog open={!!removeCourse} onOpenChange={(o) => !o && setRemoveCourse(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeCourse ? `${removeCourse.teacherName} will be unassigned from ${removeCourse.name} (Section ${removeCourse.section}).` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={doRemoveTeacher}
              disabled={removing}
            >
              {removing ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Teacher wizard: Semester -> Section -> Course -> Teacher */}
      <Dialog open={wizardOpen} onOpenChange={(o) => !o && closeWizard()}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              {step === 1 && "Step 1 of 4 · Select a semester"}
              {step === 2 && "Step 2 of 4 · Select a section"}
              {step === 3 && "Step 3 of 4 · Select a course"}
              {step === 4 && "Step 4 of 4 · Select an available teacher"}
              {step === 5 && "Assignment confirmed"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-4 gap-2">
              {SEMESTER_NUMBERS.map((n) => (
                <Button key={n} variant="outline" className="h-14 flex-col gap-0.5 rounded-xl text-xs"
                  onClick={() => { setWizSem(n); setWizSection(null); setStep(2); }}>
                  <span className="font-display text-base font-bold">{n}</span>
                  <span className="text-[10px] text-muted-foreground">Sem</span>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {wizSections.map((sec) => {
                  const count = courses.filter((c) => c.sem === wizSem && c.section === sec).length;
                  return (
                    <button
                      key={sec}
                      onClick={() => { setWizSection(sec); setStep(3); }}
                      className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 text-center transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white text-sm font-bold">{sec}</div>
                      <div className="text-[11px] text-muted-foreground">{count} course{count === 1 ? "" : "s"}</div>
                    </button>
                  );
                })}
                {wizSections.length === 0 && (
                  <div className="col-span-full py-4 text-center text-sm text-muted-foreground">No sections in this semester.</div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              <div className="rounded-xl bg-muted/40 p-2.5 text-xs">
                Semester {wizSem} · Section {wizSection}
              </div>
              {wizCoursesInSection.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setWizCourseId(c.id); setStep(4); }}
                  className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left text-sm transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.code} · {c.credits} credit hrs</div>
                  </div>
                  {c.teacherName ? <Badge variant="secondary" className="rounded-lg">Reassign</Badge> : <Badge className="rounded-lg bg-amber-500/15 text-amber-700">Unassigned</Badge>}
                </button>
              ))}
              {wizCoursesInSection.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">No courses in this section.</div>
              )}
              <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            </div>
          )}

          {step === 4 && wizCourse && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-3 text-xs">
                Assigning teacher for <b>{wizCourse.name}</b> ({wizCourse.code}) · Semester {wizCourse.sem} · Section {wizCourse.section}
              </div>
              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {teachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setWizTeacherId(t.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/40 ${wizTeacherId === t.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Avatar className="h-10 w-10"><AvatarImage src={t.photo ?? undefined} /><AvatarFallback>{t.name[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.name}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><GraduationCap className="h-3 w-3" /> {t.qualification}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Award className="h-3 w-3" /> {t.specialization}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {t.experience}</div>
                    </div>
                  </button>
                ))}
                {teachers.length === 0 && (
                  <div className="col-span-full py-4 text-center text-sm text-muted-foreground">No teachers in this department.</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back
                </Button>
                <Button className="rounded-xl gradient-brand text-white" disabled={!wizTeacherId || assigning} onClick={confirmAssign}>
                  {assigning ? "Assigning…" : "Assign Teacher"}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="font-semibold">Teacher assigned successfully.</div>
              <p className="text-sm text-muted-foreground">
                {wizTeacher?.name} has been assigned to {wizCourse?.name} (Section {wizCourse?.section}).
              </p>
              <Button className="mt-1 rounded-xl gradient-brand text-white" onClick={closeWizard}>Done</Button>
            </div>
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