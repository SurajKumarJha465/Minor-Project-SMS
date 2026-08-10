import { useEffect, useState } from "react";
import { ThemeProvider } from "@/features/Student/lib/theme";
import DashboardShell from "@/features/Student/layout/DashboardShell";
import studentModule from "@/features/Student/student";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const initialsOf = (name) =>
  name
    ?.split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

/**
 * StudentApp — self-contained student portal. Uses the student module manifest
 * to drive sidebar navigation and swap the active page in place.
 */
export default function StudentApp() {
  const flat = studentModule.nav.flatMap((s) => s.items);
  const [activeId, setActiveId] = useState(studentModule.defaultPage);
  const active = flat.find((i) => i.id === activeId) ?? flat[0];
  const Page = studentModule.pages[activeId] ?? studentModule.pages[studentModule.defaultPage];

  // Real logged-in student for the topbar — was previously hardcoded to a
  // fake "Sumit Verma" placeholder regardless of who was signed in.
  const [user, setUser] = useState(null);

  const loadUser = () => {
    fetch(`${API_URL}/api/student/me`, { headers: { ...authHeader() } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setUser({ name: data.name, role: "Student", avatar: initialsOf(data.name), photo: data.photo });
      })
      .catch(() => {
        /* topbar degrades to its default placeholder if this fails */
      });
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <ThemeProvider>
      <DashboardShell
        nav={studentModule.nav}
        activeId={activeId}
        onNavigate={setActiveId}
        breadcrumb={active?.breadcrumb ?? ["Student"]}
        user={user ?? undefined}
        brandLabel="Student Portal"
      >
        {/* onUserRefresh lets a page (e.g. Profile, after a photo upload)
            tell the topbar to re-fetch the name/avatar/photo it shows. */}
        {Page ? <Page onNavigate={setActiveId} onUserRefresh={loadUser} /> : null}
      </DashboardShell>
    </ThemeProvider>
  );
}