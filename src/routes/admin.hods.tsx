import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Mail, Phone, Eye, Pencil, Trash2, ArrowLeftRight,
  Briefcase, Award, CalendarClock, Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { hods as initialHods, hodDepartmentOptions } from "@/lib/superadmin-mock-data";

export const Route = createFileRoute("/admin/hods")({
  head: () => ({ meta: [{ title: "HOD Management · Super Admin" }] }),
  component: HodsPage,
});

type Hod = (typeof initialHods)[number];

const emptyForm = {
  name: "", email: "", phone: "", qualification: "", experience: "",
  department: "", username: "", password: "",
};

function HodsPage() {
  const [hods, setHods] = useState<Hod[]>(initialHods);
  const [q, setQ] = useState("");

  const [viewTarget, setViewTarget] = useState<Hod | null>(null);
  const [editTarget, setEditTarget] = useState<Hod | null>(null);
  const [transferTarget, setTransferTarget] = useState<Hod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hod | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [editForm, setEditForm] = useState(emptyForm);
  const [transferDept, setTransferDept] = useState("");
  const [createForm, setCreateForm] = useState(emptyForm);

  const rows = hods.filter((h) => (h.name + h.department + h.email).toLowerCase().includes(q.toLowerCase()));

  function openEdit(h: Hod) {
    setEditForm({
      name: h.name, email: h.email, phone: h.phone, qualification: h.qualification,
      experience: h.experience, department: h.department, username: "", password: "",
    });
    setEditTarget(h);
  }

  function saveEdit() {
    if (!editTarget) return;
    setHods((prev) => prev.map((h) => (h.id === editTarget.id
      ? { ...h, name: editForm.name, email: editForm.email, phone: editForm.phone, qualification: editForm.qualification, experience: editForm.experience, department: editForm.department }
      : h)));
    toast.success(`${editForm.name}'s details updated`);
    setEditTarget(null);
  }

  function openTransfer(h: Hod) {
    setTransferDept(h.department);
    setTransferTarget(h);
  }

  function confirmTransfer() {
    if (!transferTarget) return;
    setHods((prev) => prev.map((h) => (h.id === transferTarget.id ? { ...h, department: transferDept } : h)));
    toast.success(`${transferTarget.name} transferred to ${transferDept}`);
    setTransferTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setHods((prev) => prev.filter((h) => h.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} removed as HOD`);
    setDeleteTarget(null);
  }

  function createHod() {
    if (!createForm.name || !createForm.department || !createForm.email) {
      toast.error("Please fill in name, email and department");
      return;
    }
    const newHod: Hod = {
      id: `H${100 + hods.length + Math.floor(Math.random() * 900)}`,
      name: createForm.name,
      department: createForm.department,
      email: createForm.email,
      phone: createForm.phone,
      status: "active",
      qualification: createForm.qualification,
      experience: createForm.experience,
      assignedSince: new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      photo: `https://i.pravatar.cc/120?img=${Math.floor(Math.random() * 60)}`,
    };
    setHods((prev) => [newHod, ...prev]);
    toast.success(`${newHod.name} created as HOD of ${newHod.department}`);
    setCreateForm(emptyForm);
    setCreateOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">HOD Management</h1>
          <p className="text-sm text-muted-foreground">Assign, transfer or remove Heads of Department.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => { setCreateForm(emptyForm); setCreateOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Create HOD
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">All HODs ({rows.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search HODs…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">HOD</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Assigned Since</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={h.photo} /><AvatarFallback>{h.name[0]}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-semibold">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{h.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {h.email}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {h.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{h.assignedSince}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View" onClick={() => setViewTarget(h)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => openEdit(h)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Transfer Department" onClick={() => openTransfer(h)}>
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Delete" onClick={() => setDeleteTarget(h)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No HODs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
            <div>Showing {rows.length} of {hods.length}</div>
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
              <DialogHeader>
                <DialogTitle>HOD Profile</DialogTitle>
              </DialogHeader>
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
                <DetailRow icon={Briefcase} label="Experience" value={viewTarget.experience} />
                <DetailRow icon={CalendarClock} label="Assigned Since" value={viewTarget.assignedSince} />
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
            <DialogTitle>Edit HOD</DialogTitle>
            <DialogDescription>Update {editTarget?.name}'s details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Full Name"><Input className="rounded-xl" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
            <Field label="Email"><Input className="rounded-xl" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
            <Field label="Phone"><Input className="rounded-xl" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></Field>
            <Field label="Department">
              <Select value={editForm.department} onValueChange={(v) => setEditForm({ ...editForm, department: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hodDepartmentOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Qualification"><Input className="rounded-xl" value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} /></Field>
            <Field label="Experience"><Input className="rounded-xl" value={editForm.experience} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TRANSFER */}
      <Dialog open={!!transferTarget} onOpenChange={(o) => !o && setTransferTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transfer Department</DialogTitle>
            <DialogDescription>Move {transferTarget?.name} to a different department.</DialogDescription>
          </DialogHeader>
          <Field label="New Department">
            <Select value={transferDept} onValueChange={setTransferDept}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {hodDepartmentOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={!transferDept} onClick={confirmTransfer}>Confirm Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this HOD?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteTarget?.name} as Head of {deleteTarget?.department}? This action cannot be undone.
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

      {/* CREATE */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create HOD</DialogTitle>
            <DialogDescription>Add a new Head of Department.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Full Name"><Input className="rounded-xl" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" className="rounded-xl" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></Field>
            <Field label="Phone"><Input className="rounded-xl" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} /></Field>
            <Field label="Qualification"><Input className="rounded-xl" value={createForm.qualification} onChange={(e) => setCreateForm({ ...createForm, qualification: e.target.value })} /></Field>
            <Field label="Experience"><Input className="rounded-xl" placeholder="e.g. 10 years" value={createForm.experience} onChange={(e) => setCreateForm({ ...createForm, experience: e.target.value })} /></Field>
            <Field label="Department">
              <Select value={createForm.department} onValueChange={(v) => setCreateForm({ ...createForm, department: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {hodDepartmentOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Username"><Input className="rounded-xl" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} /></Field>
            <Field label="Password"><Input type="password" className="rounded-xl" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" onClick={createHod}>Create HOD</Button>
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
