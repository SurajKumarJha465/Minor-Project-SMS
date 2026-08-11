import { useEffect, useState } from "react";
import { Globe, KeyRound, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";

import SectionCard from "@/features/Student/ui/SectionCard";
import Button from "@/features/Student/ui/Button";
import Pill from "@/features/Student/ui/Pill";
import { useTheme } from "@/features/Student/lib/theme";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

function Row({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Settings is a snapshot + shortcuts page, not a second place to edit things.
// Profile.jsx already owns the real edit-profile form, password change and
// 2FA setup/disable flows — duplicating that logic here would just create a
// second source of truth (and did, before this rewrite: a fake 2FA switch
// that didn't call the real endpoint). Everything actionable routes there.
export default function Settings({ onNavigate }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/me`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const goToProfile = () => onNavigate?.("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, appearance and security.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile — read-only snapshot; name and email are administrative
            fields a student can't self-edit, phone/address/guardian info
            can be, all via the Edit Profile form on the Profile page. */}
        <SectionCard title="Profile" icon={UserRound}>
          <Row title="Display Name" description={loading ? "Loading…" : profile?.name} />
          <Row title="Email" description={loading ? "Loading…" : profile?.email} />
          <Row title="Phone" description={loading ? "Loading…" : (profile?.phone || "Not set")} />
          <div className="pt-3.5">
            <Button variant="outline" size="sm" onClick={goToProfile}>
              <UserRound className="size-4" /> Edit in Profile
            </Button>
          </div>
        </SectionCard>

        {/* Appearance — the one setting on this page that's actually live. */}
        <SectionCard title="Appearance" icon={Globe}>
          <Row title="Theme" description={isDark ? "Dark mode" : "Light mode"}>
            <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />} {isDark ? "Light" : "Dark"}
            </Button>
          </Row>
        </SectionCard>

        {/* Security — real status pulled from /api/student/me; changing
            either one happens through Profile's actual password-change and
            2FA setup/disable flows, not a second switch here. */}
        <SectionCard title="Account Security" icon={ShieldCheck} className="lg:col-span-2">
          <Row title="Password" description="Change your login password">
            <Button variant="outline" size="sm" onClick={goToProfile}>
              <KeyRound className="size-4" /> Manage in Profile
            </Button>
          </Row>
          <Row
            title="Two-Factor Authentication"
            description={loading ? "Loading…" : profile?.two_factor_enabled ? "Enabled on this account" : "Not enabled"}
          >
            <div className="flex items-center gap-2">
              <Pill tone={profile?.two_factor_enabled ? "success" : "neutral"} dot>
                {loading ? "…" : profile?.two_factor_enabled ? "Enabled" : "Disabled"}
              </Pill>
              <Button variant="outline" size="sm" onClick={goToProfile}>Manage</Button>
            </div>
          </Row>
        </SectionCard>
      </div>
    </div>
  );
}