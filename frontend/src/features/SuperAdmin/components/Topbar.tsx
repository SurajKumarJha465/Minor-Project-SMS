import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Sun, Moon, Menu, LogOut, User, ShieldCheck } from "lucide-react";
import { logout } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authHeader } from "@/lib/auth";

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export function SaTopbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const [name, setName] = useState("Super Administrator");
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/me`, { headers: { ...authHeader() } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setName(data.name);
          setPhoto(data.photo ?? undefined);
        }
      } catch {
        // topbar identity is a nice-to-have — a failed fetch just keeps the fallback label
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <header className="sticky top-0 z-30 glass">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-white shadow-soft">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Student Management System</div>
        </div>

        <div className="relative ml-2 hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search HODs, teachers, students…" className="h-10 rounded-xl bg-background/70 pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <IconBtn label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </IconBtn>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3 transition hover:bg-background">
              <Avatar className="h-8 w-8">
                <AvatarImage src={photo} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-tight">{name}</div>
                <div className="text-[10px] text-muted-foreground">Super Admin</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to="/admin/profile">
                <DropdownMenuItem><User className="mr-2 h-4 w-4" /> My Profile</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, label, badge, onClick }: { children: React.ReactNode; label: string; badge?: number; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative rounded-xl border border-transparent p-2 text-foreground/80 transition hover:border-border hover:bg-background"
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}