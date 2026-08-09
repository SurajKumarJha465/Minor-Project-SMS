import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authHeader } from "@/lib/auth";
import { Plus, BookOpen, Users, Pencil, Trash2, UserPlus, UserX, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { sections, sectionLabel, type Section } from "@/features/HoD/lib/hod-mock-data";

export const Route = createFileRoute("/hod/courses")({
  head: () => ({ meta: [{ title: "Course Management · HOD" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: Courses,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type Course = {
  id: string; code: string; name: string; credits: number; sem: number; section: Section;
  teacherId: number | null; teacherName: string | null; enrolled: number;
};

type TeacherOpt = { id: number; name: string; specialization: string | null; photo: string | null };

function mapCourse(c: any): Course {
  return {
    id: c.id, code: c.code, name: c.name, credits: c.credits, sem: c.sem,
    section: c.section as Section,
    teacherId: c.teacher_id, teacherName: c.teacher_name, enrolled: c.enrolled ?? 0,
  };
}

const emptyForm = { code: "", name: "", credits: 3, sem: 1, section: "D" as Section };

function Courses() {
  const { q: initialQ } = Route.useSearch();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState(initialQ ?? "");

  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ code: "", name: "", credits: 0, section: "D" as Section });

  const [assignCourse, setAssignCourse] = useState<Course | null>(null);
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");

  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);

  async function createCourse() {
    if (!form.code || !form.name) return;
    try {
      const res = await fetch(`${API_URL}/api/hod/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to create course");
        return;
      }
      const data = await res.json();
      setCourses((prev) => [mapCourse(data), ...prev]);
      setAddOpen(false);
      setForm({ ...emptyForm });
      toast.success(
        data.enrolled > 0
          ? `Course created — ${data.enrolled} student${data.enrolled === 1 ? "" : "s"} from Sem ${data.sem} Sec ${sectionLabel(data.section)} auto-enrolled.`
          : "Course created",
      );
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
  }

  function openEdit(c: Course) {
    setEditCourse(c);
    setEditForm({ code: c.code, name: c.name, credits: c.credits, section: c.section });
  }

  async function saveEdit() {
    if (!editCourse) return;
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${editCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update course");
        return;
      }
      const data = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === data.id ? mapCourse(data) : c)));
      setEditCourse(null);
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
  }

  function openAssign(c: Course) {
    setAssignCourse(c);
    setAssignTeacherId(c.teacherId ? String(c.teacherId) : "");
  }

  async function saveAssign(teacherIdOverride?: string) {
    if (!assignCourse) return;
    const value = teacherIdOverride !== undefined ? teacherIdOverride : assignTeacherId;
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${assignCourse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(
          value ? { teacher_id: Number(value) } : { unassign_teacher: true },
        ),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to assign teacher");
        return;
      }
      const data = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === data.id ? mapCourse(data) : c)));
      setAssignCourse(null);
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
  }

  async function doDelete() {
    if (!deleteCourse) return;
    try {
      const res = await fetch(`${API_URL}/api/hod/courses/${deleteCourse.id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to delete course");
        return;
      }
      setCourses((prev) => prev.filter((c) => c.id !== deleteCourse.id));
      setDeleteCourse(null);
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
  }

  const query = search.trim().toLowerCase();
  const filteredCourses = query
    ? courses.filter((c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        (c.teacherName ?? "").toLowerCase().includes(query) ||
        c.section.toLowerCase().includes(query) ||
        sectionLabel(c.section).toLowerCase().includes(query) ||
        `sem ${c.sem}`.includes(query),
      )
    : courses;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Course Management</h1>
          <p className="text-sm text-muted-foreground">All courses under your department.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Create Course
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name, teacher or section…"
          className="h-10 rounded-xl pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading courses…
        </div>
      )}
      {loadError && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {!loading && !loadError && query && filteredCourses.length === 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No courses match "{search}".
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCourses.map((c) => (
          <Card key={c.id} className="group rounded-2xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="rounded-lg">Sem {c.sem}</Badge>
                  <Badge variant="outline" className="rounded-lg">Sec {sectionLabel(c.section)}</Badge>
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground">{c.code}</div>
                <div className="font-display text-base font-bold leading-tight">{c.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Credits" value={c.credits} />
                <Stat label="Enrolled" value={c.enrolled} />
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs">
                {c.teacherName ? (
                  <>
                    <Avatar className="h-6 w-6"><AvatarFallback>{c.teacherName[0]}</AvatarFallback></Avatar>
                    <span className="truncate">{c.teacherName}</span>
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Unassigned</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => openAssign(c)}>
                  <UserPlus className="mr-1 h-3 w-3" /> {c.teacherName ? "Reassign" : "Assign"}
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => openEdit(c)}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-destructive" onClick={() => setDeleteCourse(c)}>
                  <Trash2 className="mr-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create course */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
            <DialogDescription>Adds a new course to your department.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Course Code" className="sm:col-span-2">
              <Input placeholder="CS-501" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Course Name" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Credits">
              <Input type="number" min={1} max={6} value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
            </Field>
            <Field label="Semester">
              <Input type="number" min={1} max={8} value={form.sem} onChange={(e) => setForm({ ...form, sem: Number(e.target.value) })} />
            </Field>
            <Field label="Section" className="sm:col-span-2">
              <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v as Section })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{sections.map((s) => <SelectItem key={s} value={s}>{sectionLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" onClick={createCourse}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit course */}
      <Dialog open={!!editCourse} onOpenChange={(o) => !o && setEditCourse(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {editCourse && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>{editCourse.code} · Sem {editCourse.sem}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field label="Course Code"><Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></Field>
                <Field label="Course Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Credits">
                    <Input type="number" min={1} max={6} value={editForm.credits} onChange={(e) => setEditForm({ ...editForm, credits: Number(e.target.value) })} />
                  </Field>
                  <Field label="Section">
                    <Select value={editForm.section} onValueChange={(v) => setEditForm({ ...editForm, section: v as Section })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{sections.map((s) => <SelectItem key={s} value={s}>{sectionLabel(s)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditCourse(null)}>Cancel</Button>
                <Button className="rounded-xl gradient-brand text-white" onClick={saveEdit}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign / reassign teacher */}
      <Dialog open={!!assignCourse} onOpenChange={(o) => !o && setAssignCourse(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {assignCourse && (
            <>
              <DialogHeader>
                <DialogTitle>Assign Teacher</DialogTitle>
                <DialogDescription>{assignCourse.name} · {assignCourse.code}</DialogDescription>
              </DialogHeader>
              <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}{t.specialization ? ` — ${t.specialization}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter className="gap-2 sm:justify-between">
                {assignCourse.teacherName && (
                  <Button variant="ghost" className="rounded-xl text-destructive" onClick={() => saveAssign("")}>
                    <UserX className="mr-1.5 h-4 w-4" /> Unassign
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setAssignCourse(null)}>Cancel</Button>
                  <Button className="rounded-xl gradient-brand text-white" disabled={!assignTeacherId} onClick={() => saveAssign()}>Save</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCourse} onOpenChange={(o) => !o && setDeleteCourse(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteCourse?.name} and its enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}