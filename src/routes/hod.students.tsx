import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, ArrowLeft, ChevronRight, CalendarRange,
  Mail, Phone, MapPin, Users2, BookOpen, ClipboardCheck,
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
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  hodStudents as initialStudents, sections, semesters, department,
  getStudentsBySemesterSection, type Section,
} from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/students")({
  head: () => ({ meta: [{ title: "Student Management · HOD" }] }),
  component: Students,
});

type Student = (typeof initialStudents)[number];

const emptyForm = {
  name: "", enrollment: "", department, semester: 1, section: "D" as Section,
  email: "", phone: "", address: "", guardianName: "", guardianPhone: "",
  username: "", password: "",
};

function Students() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [q, setQ] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);

  const rows = (selectedSem && selectedSection ? getStudentsBySemesterSection(students, selectedSem, selectedSection) : [])
    .filter((s) => (s.name + s.enrollment).toLowerCase().includes(q.toLowerCase()));

  function saveNewStudent() {
    if (!form.name || !form.enrollment) return;
    const newStudent: Student = {
      id: `S${3000 + students.length}`,
      name: form.name,
      enrollment: form.enrollment,
      semester: form.semester,
      section: form.section,
      department: form.department,
      attendance: 100,
      gpa: "0.00",
      status: "active",
      photo: `https://i.pravatar.cc/120?img=${(students.length + 5) % 60}`,
      email: form.email,
      phone: form.phone,
      address: form.address,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      username: form.username,
      coursesEnrolled: 0,
    };
    setStudents((prev) => [newStudent, ...prev]);
    setAddOpen(false);
    setForm({ ...emptyForm });
  }

  function openEdit(s: Student) {
    setEditStudent(s);
    setEditForm({ email: s.email, phone: s.phone, address: s.address, semester: s.semester, section: s.section, guardianName: s.guardianName, guardianPhone: s.guardianPhone });
  }

  function saveEdit() {
    if (!editStudent) return;
    setStudents((prev) => prev.map((s) => (s.id === editStudent.id ? { ...s, ...editForm } as Student : s)));
    setEditStudent(null);
  }

  function doDelete() {
    if (!deleteStudent) return;
    setStudents((prev) => prev.filter((s) => s.id !== deleteStudent.id));
    setDeleteStudent(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Student Management</h1>
          <p className="text-sm text-muted-foreground">All department students across 8 semesters.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Student
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">
              {selectedSem && selectedSection ? `Sem ${selectedSem} · Section ${selectedSection}` : selectedSem ? `Semester ${selectedSem}` : "Semesters"}
            </CardTitle>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <button onClick={() => { setSelectedSem(null); setSelectedSection(null); }} className={selectedSem ? "hover:text-primary hover:underline" : "font-semibold text-foreground"}>
                All Semesters
              </button>
              {selectedSem && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <button onClick={() => setSelectedSection(null)} className={selectedSection ? "hover:text-primary hover:underline" : "font-semibold text-foreground"}>
                    Semester {selectedSem}
                  </button>
                </>
              )}
              {selectedSection && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-foreground">Section {selectedSection}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedSection && (
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
              </div>
            )}
            {selectedSem !== null && (
              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => (selectedSection ? setSelectedSection(null) : setSelectedSem(null))}>
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className={selectedSection ? "p-0" : undefined}>
          {selectedSem === null && (
            <div className="grid grid-cols-2 gap-3 p-5 pt-0 sm:grid-cols-4 xl:grid-cols-8">
              {semesters.map((s) => (
                <button key={s.id} onClick={() => setSelectedSem(s.number)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft">
                  <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div className="font-display text-sm font-bold">Semester {s.number}</div>
                  <div className="text-[11px] text-muted-foreground">{s.students} students</div>
                </button>
              ))}
            </div>
          )}

          {selectedSem !== null && selectedSection === null && (
            <div className="grid grid-cols-1 gap-3 p-5 pt-0 sm:grid-cols-3">
              {sections.map((sec) => {
                const count = getStudentsBySemesterSection(students, selectedSem, sec).length;
                return (
                  <button key={sec} onClick={() => setSelectedSection(sec)}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-background/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft">
                    <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft font-display text-sm font-bold">{sec}</div>
                    <div>
                      <div className="font-display text-sm font-bold">Section {sec}</div>
                      <div className="text-[11px] text-muted-foreground">{count} students</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedSection !== null && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Photo</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Enrollment #</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3"><Avatar className="h-9 w-9"><AvatarImage src={s.photo} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar></td>
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.enrollment}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {s.email}</span></td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {s.phone}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewStudent(s)}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteStudent(s)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>Register a new student to the department.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Enrollment Number">
              <Input value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })} />
            </Field>
            <Field label="Department">
              <Input value={form.department} disabled />
            </Field>
            <Field label="Semester">
              <Select value={String(form.semester)} onValueChange={(v) => setForm({ ...form, semester: Number(v) })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => <SelectItem key={s.id} value={String(s.number)}>Semester {s.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v as Section })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sections.map((sec) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="Guardian Name">
              <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </Field>
            <Field label="Guardian Phone">
              <Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" onClick={saveNewStudent}>Save Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View student profile */}
      <Dialog open={!!viewStudent} onOpenChange={(o) => !o && setViewStudent(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {viewStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14"><AvatarImage src={viewStudent.photo} /><AvatarFallback>{viewStudent.name[0]}</AvatarFallback></Avatar>
                  <div>
                    <DialogTitle>{viewStudent.name}</DialogTitle>
                    <DialogDescription>{viewStudent.enrollment} · Sem {viewStudent.semester} · Sec {viewStudent.section}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Row icon={Mail} k="Email" v={viewStudent.email} />
                <Row icon={Phone} k="Phone" v={viewStudent.phone} />
                <Row icon={MapPin} k="Address" v={viewStudent.address} />
                <Row icon={BookOpen} k="Courses" v={`${viewStudent.coursesEnrolled} enrolled`} />
                <Row icon={ClipboardCheck} k="Attendance Summary" v={`${viewStudent.attendance}%`} />
                <Row icon={Users2} k="Guardian" v={`${viewStudent.guardianName} · ${viewStudent.guardianPhone}`} />
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewStudent(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit student */}
      <Dialog open={!!editStudent} onOpenChange={(o) => !o && setEditStudent(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {editStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>{editStudent.name} · {editStudent.enrollment}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field label="Email"><Input value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></Field>
                <Field label="Address"><Input value={editForm.address ?? ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Semester">
                    <Select value={String(editForm.semester ?? editStudent.semester)} onValueChange={(v) => setEditForm({ ...editForm, semester: Number(v) })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{semesters.map((s) => <SelectItem key={s.id} value={String(s.number)}>Semester {s.number}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Section">
                    <Select value={(editForm.section as string) ?? editStudent.section} onValueChange={(v) => setEditForm({ ...editForm, section: v as Section })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{sections.map((sec) => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Guardian Name"><Input value={editForm.guardianName ?? ""} onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })} /></Field>
                <Field label="Guardian Phone"><Input value={editForm.guardianPhone ?? ""} onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })} /></Field>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditStudent(null)}>Cancel</Button>
                <Button className="rounded-xl gradient-brand text-white" onClick={saveEdit}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteStudent} onOpenChange={(o) => !o && setDeleteStudent(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteStudent?.name} from the department records.
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ k, v, icon: Icon }: { k: string; v: string; icon: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span>{k}</span></div>
      <div className="text-right font-medium">{v}</div>
    </div>
  );
}
