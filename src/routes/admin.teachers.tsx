import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Eye, Pencil, Trash2, BookOpen, ChevronRight, ChevronLeft,
  Check, Building2, GraduationCap, Mail, Phone, Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { saTeachers as initialTeachers, departmentList, courseCatalog, type Course } from "@/lib/superadmin-mock-data";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({ meta: [{ title: "Teacher Management · Super Admin" }] }),
  component: TeachersPage,
});

type Teacher = (typeof initialTeachers)[number];

const emptyTeacherForm = {
  name: "", email: "", phone: "", qualification: "", specialization: "", username: "", password: "",
};

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [q, setQ] = useState("");
  const rows = teachers.filter((t) => (t.name + t.specialization + t.department).toLowerCase().includes(q.toLowerCase()));

  const [viewTarget, setViewTarget] = useState<Teacher | null>(null);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState(emptyTeacherForm);

  // Add Teacher wizard state
  const [addOpen, setAddOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [dept, setDept] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);

  function resetWizard() {
    setStep(1); setDept(null); setSemester(null); setSelectedCourses([]); setTeacherForm(emptyTeacherForm);
  }

  function toggleCourse(c: Course) {
    setSelectedCourses((prev) => (prev.some((x) => x.code === c.code) ? prev.filter((x) => x.code !== c.code) : [...prev, c]));
  }

  function openEdit(t: Teacher) {
    setEditForm({ name: t.name, email: t.email, phone: t.phone, qualification: t.qualification, specialization: t.specialization, username: t.username, password: "" });
    setEditTarget(t);
  }

  function saveEdit() {
    if (!editTarget) return;
    setTeachers((prev) => prev.map((t) => (t.id === editTarget.id
      ? { ...t, name: editForm.name, email: editForm.email, phone: editForm.phone, qualification: editForm.qualification, specialization: editForm.specialization }
      : t)));
    toast.success(`${editForm.name}'s details updated`);
    setEditTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} removed`);
    setDeleteTarget(null);
  }

  function saveNewTeacher() {
    if (!teacherForm.name || !teacherForm.email || selectedCourses.length === 0) {
      toast.error("Please fill in the teacher's name, email and assign at least one course");
      return;
    }
    const newTeacher: Teacher = {
      id: `T${200 + teachers.length + Math.floor(Math.random() * 900)}`,
      name: teacherForm.name,
      specialization: teacherForm.specialization,
      department: dept ?? "",
      courses: selectedCourses.length,
      email: teacherForm.email,
      phone: teacherForm.phone,
      status: "active",
      qualification: teacherForm.qualification,
      username: teacherForm.username,
      photo: `https://i.pravatar.cc/120?img=${Math.floor(Math.random() * 60)}`,
    };
    setTeachers((prev) => [newTeacher, ...prev]);
    toast.success(`${newTeacher.name} added to ${dept} · Semester ${semester}`);
    setAddOpen(false);
    resetWizard();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Teacher Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit or remove teachers across all departments.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => { resetWizard(); setAddOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">All Teachers ({rows.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search teachers…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Teacher</th>
                  <th className="px-4 py-3 text-left">Specialization</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Assigned Courses</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={t.photo} /><AvatarFallback>{t.name[0]}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-semibold">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.id} · {t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.specialization}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.department}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="rounded-lg"><BookOpen className="mr-1 h-3 w-3" /> {t.courses} courses</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View" onClick={() => setViewTarget(t)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete" onClick={() => setDeleteTarget(t)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No teachers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
            <div>Showing {rows.length} of {teachers.length}</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 rounded-lg">Prev</Button>
              <Button variant="outline" size="sm" className="h-7 rounded-lg">1</Button>
              <Button variant="outline" size="sm" className="h-7 rounded-lg">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VIEW */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {viewTarget && (
            <>
              <DialogHeader><DialogTitle>Teacher Profile</DialogTitle></DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={viewTarget.photo} /><AvatarFallback>{viewTarget.name[0]}</AvatarFallback></Avatar>
                <div>
                  <div className="text-lg font-semibold">{viewTarget.name}</div>
                  <div className="text-xs text-muted-foreground">{viewTarget.id}</div>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <DetailRow icon={Mail} label="Email" value={viewTarget.email} />
                <DetailRow icon={Phone} label="Phone" value={viewTarget.phone} />
                <DetailRow icon={Building2} label="Department" value={viewTarget.department} />
                <DetailRow icon={Award} label="Qualification" value={viewTarget.qualification} />
                <DetailRow icon={GraduationCap} label="Specialization" value={viewTarget.specialization} />
                <DetailRow icon={BookOpen} label="Assigned Courses" value={`${viewTarget.courses} courses`} />
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewTarget(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update {editTarget?.name}'s details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Full Name"><Input className="rounded-xl" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
            <Field label="Email"><Input className="rounded-xl" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
            <Field label="Phone"><Input className="rounded-xl" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></Field>
            <Field label="Qualification"><Input className="rounded-xl" value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} /></Field>
            <Field label="Specialization"><Input className="rounded-xl" value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ADD TEACHER WIZARD */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetWizard(); }}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Teacher</DialogTitle>
            <DialogDescription>
              {step === 1 && "Step 1 of 4 — Select a department"}
              {step === 2 && `Step 2 of 4 — Select a semester in ${dept}`}
              {step === 3 && `Step 3 of 4 — Choose courses (Sem ${semester}, ${dept})`}
              {step === 4 && "Step 4 of 4 — Teacher details"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {departmentList.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDept(d); setStep(2); }}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-background/50 p-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-brand text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {d}
                </button>
              ))}
            </div>
          )}

          {step === 2 && dept && (
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => {
                const s = i + 1;
                return (
                  <button
                    key={s}
                    onClick={() => { setSemester(s); setStep(3); }}
                    className="grid aspect-square place-items-center rounded-xl border border-border bg-background/50 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                  >
                    <span className="text-[10px] font-normal uppercase text-muted-foreground">Sem</span>
                    {s}
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && dept && semester && (
            <div className="grid gap-2.5">
              {courseCatalog[dept][semester].map((c) => {
                const active = selectedCourses.some((x) => x.code === c.code);
                return (
                  <div key={c.code} className={`flex items-center justify-between rounded-xl border p-3 transition ${active ? "border-primary/50 bg-primary/5" : "border-border bg-background/50"}`}>
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.code} · {c.credit} credit hrs</div>
                    </div>
                    <Button size="sm" variant={active ? "default" : "outline"} className={`rounded-lg ${active ? "gradient-brand text-white" : ""}`} onClick={() => toggleCourse(c)}>
                      {active ? <><Check className="mr-1 h-3.5 w-3.5" /> Assigned</> : "Assign Teacher"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-lg">{dept}</Badge>
                <Badge variant="secondary" className="rounded-lg">Semester {semester}</Badge>
                {selectedCourses.map((c) => <Badge key={c.code} className="rounded-lg gradient-brand text-white">{c.name}</Badge>)}
              </div>
              <Field label="Photo">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarFallback>{teacherForm.name ? teacherForm.name[0] : "T"}</AvatarFallback></Avatar>
                  <Input type="file" accept="image/*" className="rounded-xl" />
                </div>
              </Field>
              <Field label="Teacher Name"><Input className="rounded-xl" value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" className="rounded-xl" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} /></Field>
              <Field label="Phone"><Input className="rounded-xl" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} /></Field>
              <Field label="Qualification"><Input className="rounded-xl" value={teacherForm.qualification} onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })} /></Field>
              <Field label="Specialization"><Input className="rounded-xl" value={teacherForm.specialization} onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })} /></Field>
              <Field label="Username"><Input className="rounded-xl" value={teacherForm.username} onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })} /></Field>
              <Field label="Password"><Input type="password" className="rounded-xl" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} /></Field>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" className="rounded-xl" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setAddOpen(false); resetWizard(); }}>Cancel</Button>
              {step === 3 && (
                <Button className="rounded-xl gradient-brand text-white" disabled={selectedCourses.length === 0} onClick={() => setStep(4)}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {step === 4 && (
                <Button className="rounded-xl gradient-brand text-white" onClick={saveNewTeacher}>Save Teacher</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{value}</div>
      </div>
    </div>
  );
}
