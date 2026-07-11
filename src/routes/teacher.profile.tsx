import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, MapPin, Clock, Briefcase, GraduationCap, Pencil, Key, Camera, Check, X } from "lucide-react";
import { teacher as teacherData, courses } from "@/features/Teacher/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({ meta: [{ title: "My Profile · Teacher Portal" }] }),
  component: Profile,
});

function Profile() {
  const [teacher, setTeacher] = useState(teacherData);
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const [form, setForm] = useState({
    photo: teacher.photo,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    office: teacher.office,
    qualification: teacher.qualification,
    specialization: teacher.specialization,
  });

  function openEdit() {
    setForm({
      photo: teacher.photo,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      office: teacher.office,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
    });
    setEditOpen(true);
  }

  function saveProfile() {
    setTeacher((t) => ({ ...t, ...form }));
    setEditOpen(false);
    toast.success("Profile updated successfully");
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl border-0 p-0 shadow-glass">
        <div className="h-32 gradient-brand" />
        <div className="relative px-6 pb-6">
          <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-28 w-28 border-4 border-background shadow-glass">
                <AvatarImage src={teacher.photo} />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <h1 className="font-display text-2xl font-bold">{teacher.title} {teacher.name}</h1>
                <p className="text-sm text-muted-foreground">{teacher.specialization}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{teacher.department}</Badge>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">{teacher.experience} experience</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setPwOpen(true)}>
                <Key className="mr-1.5 h-4 w-4" />Change Password
              </Button>
              <Button className="rounded-xl" onClick={openEdit}>
                <Pencil className="mr-1.5 h-4 w-4" />Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl shadow-soft md:col-span-2">
          <CardHeader><CardTitle className="text-base">Contact & Office</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info icon={Mail} label="Email" value={teacher.email} />
            <Info icon={Phone} label="Phone" value={teacher.phone} />
            <Info icon={MapPin} label="Office" value={teacher.office} />
            <Info icon={Clock} label="Office Hours" value={teacher.officeHours} />
            <Info icon={Briefcase} label="Qualification" value={teacher.qualification} />
            <Info icon={GraduationCap} label="Specialization" value={teacher.specialization} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader><CardTitle className="text-base">Assigned Courses</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary font-mono text-xs font-bold">
                  {c.code.split("-")[1]}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.code} · Sem {c.sem}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your public profile information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.photo} />
                <AvatarFallback>AS</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Profile Photo URL</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={form.photo}
                    onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
                    className="rounded-xl"
                    placeholder="https://…"
                  />
                  <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-xl">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              <Field label="Office" value={form.office} onChange={(v) => setForm((f) => ({ ...f, office: v }))} />
              <Field label="Qualification" value={form.qualification} onChange={(v) => setForm((f) => ({ ...f, qualification: v }))} />
              <Field label="Specialization" value={form.specialization} onChange={(v) => setForm((f) => ({ ...f, specialization: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={saveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password modal */}
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 rounded-xl" />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

const CURRENT_PASSWORD_MOCK = "password123";

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(next);
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"][strength];

  function reset() {
    setCurrent(""); setNext(""); setConfirm(""); setError(null);
  }

  function submit() {
    if (current !== CURRENT_PASSWORD_MOCK) {
      setError("Current password is incorrect.");
      return;
    }
    if (strength < 2) {
      setError("Choose a stronger password (mix of uppercase, numbers & symbols).");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    toast.success("Password updated successfully");
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Choose a strong password you haven't used before.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground">Current Password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="mt-1 rounded-xl" />
            {next && (
              <div className="mt-2">
                <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-muted">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("flex-1 rounded-full", i < strength ? strengthColor : "bg-muted")} />
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{strengthLabel}</div>
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 rounded-xl" />
            {confirm && (
              <div className={cn("mt-1 flex items-center gap-1 text-[11px]", confirm === next ? "text-emerald-600" : "text-destructive")}>
                {confirm === next ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {confirm === next ? "Passwords match" : "Passwords do not match"}
              </div>
            )}
          </div>
          {error && <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={submit}>Update Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
