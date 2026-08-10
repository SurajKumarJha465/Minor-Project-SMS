import { useEffect, useRef, useState } from "react";
import { logout, authHeader } from "@/lib/auth";
import { Search, Sun, Moon, Menu, LogOut, User, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTeacherMe, type TeacherMeDto } from "@/features/Teacher/lib/academic-data";

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type SearchResult = {
  type: "student" | "course";
  id: string;
  name: string;
  subtitle: string;
  photo?: string | null;
  meta?: string | null;
};

const RESULT_ICON: Record<SearchResult["type"], typeof GraduationCap> = {
  student: GraduationCap,
  course: BookOpen,
};

const RESULT_LABEL: Record<SearchResult["type"], string> = {
  student: "Students",
  course: "Courses",
};

function TeacherGlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/teacher/search?q=${encodeURIComponent(trimmed)}`, {
          headers: { ...authHeader() },
        });
        if (!res.ok) return;
        const data: SearchResult[] = await res.json();
        setResults(data);
      } catch {
        // search dropdown just stays empty on failure
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToResult(result: SearchResult) {
    if (result.type === "student" && result.meta) {
      navigate({ to: "/teacher/marks", search: { courseId: result.meta } });
    } else if (result.type === "course") {
      navigate({ to: "/teacher/marks", search: { courseId: result.id } });
    } else {
      navigate({ to: "/teacher/courses" });
    }
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  const grouped = (["student", "course"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative hidden max-w-md flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search students, courses…"
        className="h-10 rounded-xl bg-background/70 pl-9"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-11 z-40 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {searching ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : grouped.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No matches for "{query.trim()}"</div>
          ) : (
            grouped.map((group) => {
              const Icon = RESULT_ICON[group.type];
              return (
                <div key={group.type} className="border-b border-border/60 py-1.5 last:border-0">
                  <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {RESULT_LABEL[group.type]}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => goToResult(item)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={item.photo ?? undefined} alt={item.name} />
                        <AvatarFallback><Icon className="h-3.5 w-3.5" /></AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const [me, setMe] = useState<TeacherMeDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeacherMe().then((data) => {
      if (!cancelled) setMe(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = me?.name ?? "";
  const firstName = displayName.split(" ")[0] ?? "";
  const initials = displayName ? displayName.split(" ").map((n) => n[0]).join("") : "";

  return (
    <header className="sticky top-0 z-30 glass">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <TeacherGlobalSearch />

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <IconBtn label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </IconBtn>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-3 transition hover:bg-background">
              <Avatar className="h-8 w-8">
                <AvatarImage src={me?.photo ?? undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-tight">{me?.title} {firstName}</div>
                <div className="text-[10px] text-muted-foreground">Teacher</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{me?.title} {displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/teacher/profile" })}>
                <User className="mr-2 h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setLogoutOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
    </header>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative rounded-xl border border-transparent p-2 text-foreground/80 transition hover:border-border hover:bg-background"
    >
      {children}
    </button>
  );
}