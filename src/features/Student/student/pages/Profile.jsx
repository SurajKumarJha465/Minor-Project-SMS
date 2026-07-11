import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import FloatingModal from "@/components/ui/FloatingModal";
import { studentProfile } from "@/data/mock/student";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </label>
  );
}

function passwordStrength(pw) {
  if (!pw) return { label: "", tone: "neutral", score: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak", tone: "danger" },
    { label: "Fair", tone: "warning" },
    { label: "Good", tone: "info" },
    { label: "Strong", tone: "success" },
  ];
  return { ...levels[Math.max(0, score - 1)], score };
}

export default function Profile() {
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSuccessOpen, setPwSuccessOpen] = useState(false);
  const p = studentProfile;

  // Photo upload preview state (in-memory only, no backend).
  const [photoPreview, setPhotoPreview] = useState(null);

  // Password form state.
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const strength = passwordStrength(newPw);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function submitPasswordChange(e) {
    e.preventDefault();
    if (!currentPw) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setPwOpen(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSuccessOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Identity header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="h-28 gradient-brand" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="-mt-12 grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary font-display text-3xl font-bold text-primary-foreground shadow-glow ring-4 ring-card">
              {photoPreview ? (
                <img src={photoPreview} alt={p.name} className="size-full object-cover" />
              ) : (
                p.avatar
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground">{p.name}</h1>
              <p className="text-sm text-muted-foreground">{p.enrollment} · {p.departmentCode}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill tone="primary" dot>Semester {p.semester}</Pill>
                <Pill tone="info" dot>Section {p.section}</Pill>
                <Pill tone="success" dot>CGPA {p.cgpa}</Pill>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              <KeyRound className="size-4" /> Change Password
            </Button>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <SectionCard title="Personal Information" icon={UserRound}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={UserRound} label="Full Name" value={p.name} />
          <Field icon={GraduationCap} label="Enrollment Number" value={p.enrollment} />
          <Field icon={Building2} label="Department" value={p.department} />
          <Field icon={Layers} label="Semester" value={`Semester ${p.semester}`} />
          <Field icon={Layers} label="Section" value={p.section} />
          <Field icon={CalendarDays} label="Batch" value={p.batch} />
          <Field icon={Mail} label="Email" value={p.email} />
          <Field icon={Phone} label="Phone" value={p.phone} />
          <Field icon={MapPin} label="Address" value={p.address} />
          <Field icon={Users} label="Guardian Name" value={p.guardianName} />
          <Field icon={Phone} label="Guardian Contact" value={p.guardianContact} />
          <Field icon={ShieldCheck} label="Username" value={p.username} />
        </div>
      </SectionCard>

      <SectionCard title="Account Security" icon={ShieldCheck}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of protection to your account.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("2FA setup coming soon")}>
            Enable 2FA
          </Button>
        </div>
      </SectionCard>

      {/* Edit modal */}
      <FloatingModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" description="Update your contact and guardian details.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setEditOpen(false);
            toast.success("Profile updated successfully");
          }}
        >
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary font-display text-xl font-bold text-primary-foreground">
              {photoPreview ? <img src={photoPreview} alt="" className="size-full object-cover" /> : p.avatar}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
              <Camera className="size-4" /> Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone</span>
              <input defaultValue={p.phone} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
              <input defaultValue={p.email} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Address</span>
            <input defaultValue={p.address} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Guardian Name</span>
              <input defaultValue={p.guardianName} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Guardian Contact</span>
              <input defaultValue={p.guardianContact} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </FloatingModal>

      {/* Password modal */}
      <FloatingModal open={pwOpen} onClose={() => setPwOpen(false)} title="Change Password" description="Choose a strong new password.">
        <form className="space-y-4" onSubmit={submitPasswordChange}>
          <PasswordInput label="Current Password" value={currentPw} onChange={setCurrentPw} />
          <PasswordInput label="New Password" value={newPw} onChange={setNewPw} />
          {newPw && (
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    strength.tone === "danger" ? "bg-destructive" :
                    strength.tone === "warning" ? "bg-warning" :
                    strength.tone === "info" ? "bg-info" : "bg-success"
                  }`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
            </div>
          )}
          <PasswordInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </FloatingModal>

      {/* Password success dialog */}
      <FloatingModal open={pwSuccessOpen} onClose={() => setPwSuccessOpen(false)} title="Password Updated" description="Your password has been changed successfully.">
        <div className="flex justify-end">
          <Button onClick={() => setPwSuccessOpen(false)}>Done</Button>
        </div>
      </FloatingModal>
    </div>
  );
}
