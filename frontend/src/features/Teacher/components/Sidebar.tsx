import { Link, useLocation } from "@tanstack/react-router";
import { logout } from "@/lib/auth";
import { useState } from "react";
import {
  LayoutDashboard, User, BookOpen, ClipboardCheck, GraduationCap,
  BarChart3, Bell, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const nav = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/profile", label: "My Profile", icon: User },
  { to: "/teacher/courses", label: "My Courses", icon: BookOpen },
  { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/teacher/marks", label: "Internal Marks", icon: GraduationCap },
  { to: "/teacher/performance", label: "Performance", icon: BarChart3 },
  { to: "/teacher/notices", label: "Notice", icon: Bell },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);

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
          <Link to="/teacher/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold leading-tight">EduPortal</div>
              <div className="truncate text-[11px] text-muted-foreground">Student Mgmt System</div>
            </div>
          </Link>
          <button className="rounded-lg p-1.5 hover:bg-sidebar-accent lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
          <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Teacher Workspace
          </div>
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/teacher/dashboard" && pathname.startsWith(to));
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
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive/90 hover:bg-destructive/10"
            >
              <LogOut className="h-[18px] w-[18px]" /> Logout
            </button>
          </div>
        </nav>
      </aside>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>You'll need to sign in again to access the Teacher Dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={logout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}