import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, ClipboardCheck, BarChart3, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/attendance", label: "Attend", icon: ClipboardCheck },
  { to: "/performance", label: "Stats", icon: BarChart3 },
  { to: "/notices", label: "Notices", icon: Bell },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass px-2 py-1.5 lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
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
