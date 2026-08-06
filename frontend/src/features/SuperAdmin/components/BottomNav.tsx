import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck, Users, GraduationCap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/admin/hods", label: "HODs", icon: ShieldCheck },
  { to: "/admin/teachers", label: "Teachers", icon: Users },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/settings", label: "System", icon: Settings },
] as const;

export function SaBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass px-2 py-1.5 lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/admin/dashboard" && pathname.startsWith(to));
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
