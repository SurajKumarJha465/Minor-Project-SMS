import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Camera,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Layers,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  UserRound,
  Users,
} from "lucide-react";

import SectionCard from "@/features/Student/ui/SectionCard";
import Button from "@/features/Student/ui/Button";
import Pill from "@/features/Student/ui/Pill";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { authHeader } from "@/lib/auth";
import AuthImg from "@/lib/AuthImg";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Same convention as the teacher/HOD profile pages: the backend returns a
// relative /uploads/profile-photos/<file> path, which needs the API origin
// prefixed since the frontend and backend run on different ports/hosts.
function photoSrc(photo) {
  if (!photo) return undefined;
  return photo.startsWith("http") ? photo : `${API_URL}${photo}`;
}

function initials(name) {
  if (!name) return "??";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Field({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
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
          autoComplete="off"
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

export default function Profile({ onUserRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [phoneField, setPhoneField] = useState("");
  const [addressField, setAddressField] = useState("");
  const [guardianNameField, setGuardianNameField] = useState("");
  const [guardianPhoneField, setGuardianPhoneField] = useState("");

  const [pwOpen, setPwOpen] = useState(false);
  const [pwSuccessOpen, setPwSuccessOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const strength = passwordStrength(newPw);

  // Photo upload: photoPreview shows the picked file immediately (via
  // createObjectURL) while the upload is in flight; once the server responds,
  // `profile.photo` (the persisted URL) takes over as the source of truth.
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 2FA setup flow.
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState("start"); // start | verify
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaUri, setTwoFaUri] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);

  async function loadProfile({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/student/me`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your profile.");
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  // Nudge the student the moment we know their password needs changing.
  useEffect(() => {
    if (profile?.must_change_password) {
      toast.warning("Your account requires a password change.", {
        description: "Please update your password to keep your account secure.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.must_change_password]);

  function openEdit() {
    if (!profile) return;
    setPhoneField(profile.phone ?? "");
    setAddressField(profile.address ?? "");
    setGuardianNameField(profile.guardian_name ?? "");
    setGuardianPhoneField(profile.guardian_phone ?? "");
    setEditOpen(true);
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/student/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          phone: phoneField,
          address: addressField,
          guardian_name: guardianNameField,
          guardian_phone: guardianPhoneField,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update profile");
        return;
      }
      const data = await res.json();
      setProfile(data);
      setEditOpen(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is larger than the 5 MB limit");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/student/me/photo`, {
        method: "POST",
        headers: { ...authHeader() },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to upload photo");
        return;
      }
      const data = await res.json();
      setProfile(data);
      toast.success("Profile picture updated");
      onUserRefresh?.(); // topbar avatar is a separate fetch — nudge it to pick up the new photo
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setUploadingPhoto(false);
      setPhotoPreview(null);
      URL.revokeObjectURL(localUrl);
    }
  }

  function closePasswordDialog() {
    setPwOpen(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  async function submitPasswordChange(e) {
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
    setSavingPw(true);
    try {
      const res = await fetch(`${API_URL}/api/student/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update password");
        return;
      }
      closePasswordDialog();
      setPwSuccessOpen(true);
      // Reflect the cleared must_change_password flag immediately.
      setProfile((p) => (p ? { ...p, must_change_password: false } : p));
      loadProfile({ silent: true });
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSavingPw(false);
    }
  }

  async function startTwoFaSetup() {
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/student/2fa/setup`, {
        method: "POST",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Could not start 2FA setup");
        return;
      }
      const data = await res.json();
      setTwoFaSecret(data.secret);
      setTwoFaUri(data.otpauth_url);
      setTwoFaStep("verify");
      setTwoFaOpen(true);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setTwoFaBusy(false);
    }
  }

  function closeTwoFaModal() {
    setTwoFaOpen(false);
    setTwoFaStep("start");
    setTwoFaSecret("");
    setTwoFaUri("");
    setTwoFaCode("");
  }

  async function confirmTwoFa(e) {
    e.preventDefault();
    if (twoFaCode.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/student/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code: twoFaCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Invalid code, try again");
        return;
      }
      toast.success("Two-factor authentication enabled");
      closeTwoFaModal();
      setProfile((p) => (p ? { ...p, two_factor_enabled: true } : p));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function confirmDisableTwoFa(e) {
    e.preventDefault();
    if (disableCode.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setDisableBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/student/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Invalid code, try again");
        return;
      }
      toast.success("Two-factor authentication disabled");
      setDisableOpen(false);
      setDisableCode("");
      setProfile((p) => (p ? { ...p, two_factor_enabled: false } : p));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setDisableBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError ?? "Profile unavailable."}</p>
        <Button size="sm" variant="outline" onClick={() => loadProfile()}>Retry</Button>
      </div>
    );
  }

  const p = profile;

  return (
    <div className="space-y-6">
      {/* Must-change-password reminder */}
      {p.must_change_password && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Please update your password</p>
              <p className="text-xs text-muted-foreground">
                Your account is still using a temporary password. Change it now to keep your account secure.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setPwOpen(true)}>
            <KeyRound className="size-4" /> Update Password Now
          </Button>
        </div>
      )}

      {/* Identity header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="h-28 gradient-brand" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="-mt-12 grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary font-display text-3xl font-bold text-primary-foreground shadow-glow ring-4 ring-card">
              {photoPreview ? (
                <img src={photoPreview} alt={p.name} className="size-full object-cover" />
              ) : p.photo ? (
                <AuthImg src={photoSrc(p.photo)} alt={p.name} className="size-full object-cover" />
              ) : (
                initials(p.name)
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground">{p.name}</h1>
              <p className="text-sm text-muted-foreground">{p.enrollment} · {p.department}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill tone="primary" dot>Semester {p.semester}</Pill>
                <Pill tone="info" dot>Section {p.section}</Pill>
                <Pill tone="success" dot>Batch {p.batch}</Pill>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              <KeyRound className="size-4" /> Change Password
            </Button>
            <Button size="sm" onClick={openEdit}>
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
          <Field icon={Mail} label="Email" value={p.email} hint="Contact your department to change this" />
          <Field icon={Phone} label="Phone" value={p.phone || "—"} />
          <Field icon={MapPin} label="Address" value={p.address || "—"} />
          <Field icon={Users} label="Guardian Name" value={p.guardian_name || "—"} />
          <Field icon={Phone} label="Guardian Contact" value={p.guardian_phone || "—"} />
          <Field icon={ShieldCheck} label="Username" value={p.username} />
        </div>
      </SectionCard>

      <SectionCard title="Account Security" icon={ShieldCheck}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              {p.two_factor_enabled
                ? "Enabled — your account requires an authenticator code at login."
                : "Add an extra layer of protection to your account."}
            </p>
          </div>
          {p.two_factor_enabled ? (
            <div className="flex items-center gap-2">
              <Pill tone="success" dot>Enabled</Pill>
              <Button variant="outline" size="sm" onClick={() => setDisableOpen(true)}>
                <ShieldOff className="size-4" /> Disable 2FA
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={startTwoFaSetup} disabled={twoFaBusy}>
              <ShieldCheck className="size-4" /> {twoFaBusy ? "Preparing…" : "Enable 2FA"}
            </Button>
          )}
        </div>
      </SectionCard>

      {/* Edit modal */}
      <FloatingModal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" description="Update your contact and guardian details.">
        <form className="space-y-4" onSubmit={submitEdit}>
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-primary font-display text-xl font-bold text-primary-foreground">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="size-full object-cover" />
              ) : p.photo ? (
                <AuthImg src={photoSrc(p.photo)} alt="" className="size-full object-cover" />
              ) : (
                initials(p.name)
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-60">
              <Camera className="size-4" /> {uploadingPhoto ? "Uploading…" : "Upload Photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone</span>
              <input
                value={phoneField}
                onChange={(e) => setPhoneField(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Lock className="size-3" /> Email
              </span>
              <input
                value={p.email}
                disabled
                readOnly
                title="Email cannot be changed here — contact your department to update it."
                className="h-10 w-full cursor-not-allowed rounded-xl border border-border bg-muted px-3 text-sm text-muted-foreground outline-none"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Address</span>
            <input
              value={addressField}
              onChange={(e) => setAddressField(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Guardian Name</span>
              <input
                value={guardianNameField}
                onChange={(e) => setGuardianNameField(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Guardian Contact</span>
              <input
                value={guardianPhoneField}
                onChange={(e) => setGuardianPhoneField(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </FloatingModal>

      {/* Password modal */}
      <FloatingModal open={pwOpen} onClose={closePasswordDialog} title="Change Password" description="Choose a strong new password.">
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
            <Button type="button" variant="ghost" onClick={closePasswordDialog}>Cancel</Button>
            <Button type="submit" disabled={savingPw}>{savingPw ? "Updating…" : "Update Password"}</Button>
          </div>
        </form>
      </FloatingModal>

      {/* Password success dialog */}
      <FloatingModal open={pwSuccessOpen} onClose={() => setPwSuccessOpen(false)} title="Password Updated" description="Your password has been changed successfully.">
        <div className="flex justify-end">
          <Button onClick={() => setPwSuccessOpen(false)}>Done</Button>
        </div>
      </FloatingModal>

      {/* 2FA setup modal */}
      <FloatingModal
        open={twoFaOpen}
        onClose={closeTwoFaModal}
        title="Enable Two-Factor Authentication"
        description="Scan or enter this key in your authenticator app, then confirm with a code."
      >
        <form className="space-y-4" onSubmit={confirmTwoFa}>
          <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Setup key (enter manually in Google Authenticator, Authy, etc.)</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 text-sm font-semibold tracking-wider text-foreground">
                {twoFaSecret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(twoFaSecret);
                    toast.success("Copied to clipboard");
                  } catch {
                    toast.error("Could not copy — copy it manually");
                  }
                }}
                aria-label="Copy setup key"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">6-digit code</span>
            <input
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-center text-lg font-semibold tracking-[0.5em] outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeTwoFaModal}>Cancel</Button>
            <Button type="submit" disabled={twoFaBusy}>{twoFaBusy ? "Verifying…" : "Verify & Enable"}</Button>
          </div>
        </form>
      </FloatingModal>

      {/* 2FA disable modal */}
      <FloatingModal
        open={disableOpen}
        onClose={() => { setDisableOpen(false); setDisableCode(""); }}
        title="Disable Two-Factor Authentication"
        description="Enter a current code from your authenticator app to confirm."
      >
        <form className="space-y-4" onSubmit={confirmDisableTwoFa}>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">6-digit code</span>
            <input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-center text-lg font-semibold tracking-[0.5em] outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setDisableOpen(false); setDisableCode(""); }}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={disableBusy}>{disableBusy ? "Disabling…" : "Disable"}</Button>
          </div>
        </form>
      </FloatingModal>
    </div>
  );
}