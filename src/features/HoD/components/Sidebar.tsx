import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, GraduationCap, CalendarRange,
  Bell, User, Settings, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/hod/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hod/overview", label: "Department Overview", icon: Building2 },
  { to: "/hod/teachers", label: "Teacher Management", icon: Users },
  { to: "/hod/students", label: "Student Management", icon: GraduationCap },
  { to: "/hod/semesters", label: "Semester Management", icon: CalendarRange },
  { to: "/hod/notices", label: "Department Notices", icon: Bell },
  { to: "/hod/profile", label: "Profile", icon: User },
  { to: "/hod/settings", label: "Settings", icon: Settings },
] as const;

export function HodSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/hod/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold leading-tight">EduPortal</div>
              <div className="truncate text-[11px] text-muted-foreground">HOD · Comp. Engg.</div>
            </div>
          </Link>
          <button className="rounded-lg p-1.5 hover:bg-sidebar-accent lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
          <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            HOD Workspace
          </div>
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/hod/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          <div className="mt-auto pt-2">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive/90 hover:bg-destructive/10">
              <LogOut className="h-[18px] w-[18px]" /> Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
