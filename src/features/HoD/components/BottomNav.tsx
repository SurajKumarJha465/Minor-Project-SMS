import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, GraduationCap, CalendarRange, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/hod/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/hod/teachers", label: "Teachers", icon: Users },
  { to: "/hod/students", label: "Students", icon: GraduationCap },
  { to: "/hod/semesters", label: "Semesters", icon: CalendarRange },
  { to: "/hod/notices", label: "Notices", icon: Bell },
] as const;

export function HodBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass px-2 py-1.5 lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/hod/dashboard" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link to={to} className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}>
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
