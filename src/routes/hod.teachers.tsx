import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { hodCourses as initialCourses, teachers, semesters } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/teachers")({
  head: () => ({ meta: [{ title: "Teacher Management · HOD" }] }),
  component: TeacherManagement,
});

type Course = (typeof initialCourses)[number];

function TeacherManagement() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);

  // Assign-teacher wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizSem, setWizSem] = useState<number | null>(null);
  const [wizCourseId, setWizCourseId] = useState<string | null>(null);
  const [wizTeacherName, setWizTeacherName] = useState<string | null>(null);

  // View / remove dialogs
  const [viewCourse, setViewCourse] = useState<Course | null>(null);
  const [removeCourse, setRemoveCourse] = useState<Course | null>(null);

  const semCourses = selectedSem ? courses.filter((c) => c.sem === selectedSem) : [];
  const wizCourses = wizSem ? courses.filter((c) => c.sem === wizSem) : [];
  const wizCourse = courses.find((c) => c.id === wizCourseId) || null;

  function teacherPhoto(name: string | null) {
    return teachers.find((t) => t.name === name)?.photo;
  }

  function openAssignWizard(courseToEdit?: Course) {
    if (courseToEdit) {
      setWizSem(courseToEdit.sem);
      setWizCourseId(courseToEdit.id);
      setStep(3);
    } else {
      setWizSem(selectedSem ?? null);
      setWizCourseId(null);
      setStep(selectedSem ? 2 : 1);
    }
    setWizTeacherName(null);
    setWizardOpen(true);
  }

  function confirmAssign() {
    if (!wizCourseId || !wizTeacherName) return;
    setCourses((prev) => prev.map((c) => (c.id === wizCourseId ? { ...c, teacher: wizTeacherName } : c)));
    setStep(4);
  }

  function closeWizard() {
    setWizardOpen(false);
    setStep(1);
    setWizSem(null);
    setWizCourseId(null);
    setWizTeacherName(null);
  }

  function doRemoveTeacher() {
    if (!removeCourse) return;
    setCourses((prev) => prev.map((c) => (c.id === removeCourse.id ? { ...c, teacher: null } : c)));
    setRemoveCourse(null);
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
              {semesters.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSem(s.number)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div className="font-display text-sm font-bold">Semester {s.number}</div>
                  <div className="text-[11px] text-muted-foreground">{s.courses} courses</div>
                </button>
              ))}
            </div>
          )}

          {selectedSem && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {semCourses.map((c) => (
                <Card key={c.id} className="rounded-2xl shadow-soft">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      {c.teacher ? (
                        <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Assigned</Badge>
                      ) : (
                        <Badge className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">Unassigned</Badge>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{c.code}</div>
                      <div className="font-display text-base font-bold leading-tight">{c.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.credits} Credit Hours</div>
                    <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-sm">
                      {c.teacher ? (
                        <>
                          <Avatar className="h-7 w-7"><AvatarImage src={teacherPhoto(c.teacher)} /><AvatarFallback>{c.teacher[0]}</AvatarFallback></Avatar>
                          <span className="truncate">{c.teacher}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No teacher assigned</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setViewCourse(c)}>
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => openAssignWizard(c)}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      {c.teacher && (
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-destructive" onClick={() => setRemoveCourse(c)}>
                          <UserX className="mr-1 h-3 w-3" /> Remove Teacher
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                <DialogDescription>{viewCourse.code} · Semester {viewCourse.sem}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Row label="Assigned Teacher" value={viewCourse.teacher ?? "Unassigned"} />
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
              {removeCourse ? `${removeCourse.teacher} will be unassigned from ${removeCourse.name}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doRemoveTeacher}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Teacher wizard */}
      <Dialog open={wizardOpen} onOpenChange={(o) => !o && closeWizard()}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              {step === 1 && "Step 1 of 3 · Select a semester"}
              {step === 2 && "Step 2 of 3 · Select a course"}
              {step === 3 && "Step 3 of 3 · Select an available teacher"}
              {step === 4 && "Assignment confirmed"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-4 gap-2">
              {semesters.map((s) => (
                <Button key={s.id} variant="outline" className="h-14 flex-col gap-0.5 rounded-xl text-xs"
                  onClick={() => { setWizSem(s.number); setStep(2); }}>
                  <span className="font-display text-base font-bold">{s.number}</span>
                  <span className="text-[10px] text-muted-foreground">Sem</span>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {wizCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setWizCourseId(c.id); setStep(3); }}
                  className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left text-sm transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.code} · {c.credits} credit hrs</div>
                  </div>
                  {c.teacher ? <Badge variant="secondary" className="rounded-lg">Reassign</Badge> : <Badge className="rounded-lg bg-amber-500/15 text-amber-700">Unassigned</Badge>}
                </button>
              ))}
              <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            </div>
          )}

          {step === 3 && wizCourse && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 p-3 text-xs">
                Assigning teacher for <b>{wizCourse.name}</b> ({wizCourse.code}) · Semester {wizCourse.sem}
              </div>
              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {teachers.filter((t) => t.status === "active").map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setWizTeacherName(t.name)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-muted/40 ${wizTeacherName === t.name ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Avatar className="h-10 w-10"><AvatarImage src={t.photo} /><AvatarFallback>{t.name[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.name}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><GraduationCap className="h-3 w-3" /> {t.qualification}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Award className="h-3 w-3" /> {t.specialization}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {t.experience}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => setStep(wizSem ? 2 : 1)}>
                  <ArrowLeft className="mr-1 h-3 w-3" /> Back
                </Button>
                <Button className="rounded-xl gradient-brand text-white" disabled={!wizTeacherName} onClick={confirmAssign}>
                  Assign Teacher
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="font-semibold">Teacher assigned successfully.</div>
              <p className="text-sm text-muted-foreground">
                {wizTeacherName} has been assigned to {wizCourse?.name}.
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
