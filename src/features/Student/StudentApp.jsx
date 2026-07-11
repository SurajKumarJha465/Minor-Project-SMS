import { useState } from "react";
import { ThemeProvider } from "@/features/Student/lib/theme";
import DashboardShell from "@/features/Student/layout/DashboardShell";
import studentModule from "@/features/Student/student";

/**
 * StudentApp — self-contained student portal. Uses the student module manifest
 * to drive sidebar navigation and swap the active page in place.
 */
export default function StudentApp() {
  const flat = studentModule.nav.flatMap((s) => s.items);
  const [activeId, setActiveId] = useState(studentModule.defaultPage);
  const active = flat.find((i) => i.id === activeId) ?? flat[0];
  const Page = studentModule.pages[activeId] ?? studentModule.pages[studentModule.defaultPage];

  return (
    <ThemeProvider>
      <DashboardShell
        nav={studentModule.nav}
        activeId={activeId}
        onNavigate={setActiveId}
        breadcrumb={active?.breadcrumb ?? ["Student"]}
        user={studentModule.user}
        brandLabel="Student Portal"
      >
        {Page ? <Page /> : null}
      </DashboardShell>
    </ThemeProvider>
  );
}
