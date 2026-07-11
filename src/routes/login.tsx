import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, GraduationCap, ShieldCheck, Building2, BookOpen, Sparkles, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Smart Student Management System" },
      { name: "description", content: "Sign in to the Smart Student Management System — an intelligent academic platform for students, teachers, HODs and administrators." },
    ],
  }),
  component: LoginPage,
});

const ACCOUNTS: Record<string, { role: "admin" | "hod" | "teacher" | "student"; to: string }> = {
  "admin@ssms.edu":   { role: "admin",   to: "/admin/dashboard" },
  "hod@ssms.edu":     { role: "hod",     to: "/hod/dashboard" },
  "teacher@ssms.edu": { role: "teacher", to: "/dashboard" },
  "student@ssms.edu": { role: "student", to: "/dashboard" },
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [err, setErr] = useState<{ email?: string; password?: string; form?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof err = {};
    if (!email.trim()) errs.email = "Please enter your email.";
    if (!password) errs.password = "Please enter your password.";
    if (Object.keys(errs).length) { setErr(errs); return; }

    const acc = ACCOUNTS[email.trim().toLowerCase()];
    if (!acc || password !== "123456") {
      setErr({ form: "Invalid email or password." });
      toast.error("Invalid email or password.");
      return;
    }
    setErr({});
    setLoading(true);
    setTimeout(() => {
      toast.success(`Login Successful — opening ${acc.role.toUpperCase()} dashboard`);
      navigate({ to: acc.to });
    }, 900);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full gradient-brand opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full gradient-brand opacity-20 blur-3xl" />

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-12">
        {/* LEFT: Illustration + welcome */}
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card/60 p-10 shadow-glass backdrop-blur lg:flex">
          <div className="absolute inset-0 gradient-brand opacity-10" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Intelligent University ERP
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight">
              Welcome to <span className="text-gradient-brand">Smart Student Management System</span>
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Manage your academic journey efficiently through one intelligent platform designed for
              students, teachers, department heads, and administrators.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative my-8 flex flex-1 items-center justify-center">
            <Illustration />
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, label: "Super Admin", desc: "Institution control" },
              { icon: Building2,   label: "HOD",         desc: "Department leadership" },
              { icon: GraduationCap, label: "Teacher",   desc: "Classroom & AI attendance" },
              { icon: BookOpen,    label: "Student",     desc: "Personal academic hub" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-border bg-background/60 p-3 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-white shadow-soft">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Login card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md animate-fade-in">
            <div className="glass rounded-3xl p-7 shadow-glass md:p-9">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-white shadow-soft">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold tracking-tight">Smart Student Management System</h2>
                <p className="mt-1 text-xs text-muted-foreground">An Intelligent Platform for Academic Management</p>
                <div className="mt-3 h-px w-16 bg-border" />
                <p className="mt-3 text-sm font-medium">Please sign in to continue</p>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@ssms.edu"
                      className="h-11 rounded-xl bg-background/70 pl-9"
                      autoComplete="email"
                    />
                  </div>
                  {err.email && <p className="mt-1 text-xs text-destructive">{err.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl bg-background/70 pl-9 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {err.password && <p className="mt-1 text-xs text-destructive">{err.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground/80">
                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {err.form && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {err.form}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl gradient-brand text-white shadow-soft transition hover:opacity-95 hover:shadow-glass"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</span>
                  ) : "Login"}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Your dashboard will be opened automatically based on your account role.
                </p>
              </form>

              <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/40 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Demo accounts</div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px] text-foreground/80">
                  <code>admin@ssms.edu</code>
                  <code>hod@ssms.edu</code>
                  <code>teacher@ssms.edu</code>
                  <code>student@ssms.edu</code>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">Password: <code>123456</code></div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-1 text-center text-[11px] text-muted-foreground">
              <div>© 2026 Smart Student Management System · All Rights Reserved.</div>
              <Link to="/" className="text-primary hover:underline">Back to role selector</Link>
            </div>
          </div>
        </section>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-glass animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">Forgot password?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Password recovery will be available in a future update. For now, please contact your department administrator.
                </p>
              </div>
              <button className="rounded-lg p-1.5 hover:bg-muted" onClick={() => setForgotOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button className="mt-5 h-10 w-full rounded-xl gradient-brand text-white" onClick={() => setForgotOpen(false)}>Got it</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Custom SVG illustration: campus + AI learning --- */
function Illustration() {
  return (
    <svg viewBox="0 0 520 380" className="h-full w-full max-h-[420px]" role="img" aria-label="Students, teachers and technology at a smart campus">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#D0E7E6" />
          <stop offset="1" stopColor="#95CCDD" />
        </linearGradient>
        <linearGradient id="bld" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4274D9" />
          <stop offset="1" stopColor="#293681" />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect x="0" y="0" width="520" height="300" rx="24" fill="url(#sky)" />
      {/* ground */}
      <rect x="0" y="290" width="520" height="90" rx="24" fill="#D0E7E6" opacity="0.6" />

      {/* floating orbs */}
      <g className="animate-fade-in">
        <circle cx="60" cy="60" r="10" fill="#4274D9" opacity="0.35" />
        <circle cx="470" cy="90" r="14" fill="#293681" opacity="0.25" />
        <circle cx="420" cy="40" r="6" fill="#4274D9" opacity="0.5" />
      </g>

      {/* university building */}
      <g>
        <polygon points="180,140 260,90 340,140" fill="url(#bld)" />
        <rect x="185" y="140" width="150" height="140" fill="url(#bld)" />
        <rect x="205" y="170" width="20" height="30" fill="#D0E7E6" />
        <rect x="245" y="170" width="20" height="30" fill="#D0E7E6" />
        <rect x="285" y="170" width="20" height="30" fill="#D0E7E6" />
        <rect x="205" y="215" width="20" height="30" fill="#D0E7E6" />
        <rect x="285" y="215" width="20" height="30" fill="#D0E7E6" />
        <rect x="245" y="215" width="20" height="65" fill="#95CCDD" />
        {/* flag */}
        <line x1="260" y1="90" x2="260" y2="60" stroke="#293681" strokeWidth="3" />
        <polygon points="260,60 285,66 260,72" fill="#4274D9" />
      </g>

      {/* graduation cap floating */}
      <g transform="translate(90,110)">
        <polygon points="0,20 40,5 80,20 40,35" fill="#293681" />
        <rect x="35" y="20" width="10" height="18" fill="#293681" />
        <circle cx="70" cy="12" r="3" fill="#4274D9" />
        <line x1="70" y1="12" x2="80" y2="30" stroke="#4274D9" strokeWidth="2" />
      </g>

      {/* book */}
      <g transform="translate(380,150)">
        <rect x="0" y="0" width="80" height="55" rx="6" fill="#4274D9" />
        <rect x="6" y="6" width="68" height="43" rx="4" fill="#D0E7E6" />
        <line x1="40" y1="6" x2="40" y2="49" stroke="#4274D9" strokeWidth="2" />
        <line x1="14" y1="18" x2="34" y2="18" stroke="#4274D9" strokeWidth="1.5" />
        <line x1="14" y1="26" x2="34" y2="26" stroke="#4274D9" strokeWidth="1.5" />
        <line x1="46" y1="18" x2="66" y2="18" stroke="#4274D9" strokeWidth="1.5" />
        <line x1="46" y1="26" x2="66" y2="26" stroke="#4274D9" strokeWidth="1.5" />
      </g>

      {/* AI node network */}
      <g transform="translate(360,230)" opacity="0.9">
        <circle cx="0" cy="0" r="14" fill="#293681" />
        <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#D0E7E6">AI</text>
        <circle cx="40" cy="-20" r="5" fill="#4274D9" />
        <circle cx="50" cy="15" r="5" fill="#4274D9" />
        <circle cx="30" cy="35" r="5" fill="#4274D9" />
        <line x1="0" y1="0" x2="40" y2="-20" stroke="#4274D9" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="50" y2="15" stroke="#4274D9" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="30" y2="35" stroke="#4274D9" strokeWidth="1.5" />
      </g>

      {/* students */}
      <g transform="translate(120,240)">
        <circle cx="0" cy="0" r="12" fill="#293681" />
        <rect x="-14" y="12" width="28" height="34" rx="8" fill="#4274D9" />
      </g>
      <g transform="translate(160,250)">
        <circle cx="0" cy="0" r="12" fill="#4274D9" />
        <rect x="-14" y="12" width="28" height="34" rx="8" fill="#293681" />
      </g>
      {/* teacher */}
      <g transform="translate(300,250)">
        <circle cx="0" cy="-2" r="13" fill="#293681" />
        <rect x="-16" y="12" width="32" height="38" rx="8" fill="#4274D9" />
        <rect x="14" y="20" width="18" height="12" rx="2" fill="#D0E7E6" />
      </g>
    </svg>
  );
}
