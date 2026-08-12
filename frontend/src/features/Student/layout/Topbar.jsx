import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronRight, Loader2, LogOut, Megaphone, Menu, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/features/Student/lib/theme";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import Button from "@/features/Student/ui/Button";
import AuthImg from "@/lib/AuthImg";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Same convention as Profile.jsx: the backend returns a relative
// /uploads/profile-photos/<file> path that needs the API origin prefixed.
function photoSrc(photo) {
  if (!photo) return undefined;
  return photo.startsWith("http") ? photo : `${API_URL}${photo}`;
}

const RESULT_ICON = { course: BookOpen, notice: Megaphone };
const RESULT_LABEL = { course: "Courses", notice: "Notices" };
// Where a result sends you — there's no per-item deep link (no course-detail
// route, no notice-detail route), so this just jumps to the list page, same
// as the "View all" buttons elsewhere in the app.
const RESULT_PAGE = { course: "courses", notice: "notice-board" };

/**
 * StudentGlobalSearch — debounced lookup across the student's own enrolled
 * courses and the notices visible to them. Mirrors TeacherGlobalSearch /
 * HoD's topbar search (same GET /api/<role>/search?q= pattern), just scoped
 * to what a student actually has: their courses and their notice feed.
 */
function StudentGlobalSearch({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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
        const data = await apiJson(`/api/student/search?q=${encodeURIComponent(trimmed)}`);
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

  function goToResult(result) {
    onNavigate?.(RESULT_PAGE[result.type] ?? "dashboard");
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  const grouped = ["course", "notice"]
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div ref={containerRef} className="relative ml-auto hidden max-w-xs flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        placeholder="Search courses, notices…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-11 z-40 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
          {searching ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
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
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg gradient-mist text-primary">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground">{item.name}</div>
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

/**
 * Topbar — breadcrumb, global search, theme toggle, profile and logout.
 */
export default function Topbar({
  breadcrumb = [],
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  user = { name: "Loading…", role: "Student", avatar: "··" },
  roleId,
  roleOptions = [],
  onRoleChange,
  onNavigate,
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = () => {
    setLogoutOpen(false);
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobile}
        className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="hidden size-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent lg:grid"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      {/* Breadcrumb */}
      <nav className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
            <span
              className={cn(
                "truncate",
                i === breadcrumb.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <StudentGlobalSearch onNavigate={onNavigate} />

      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-accent md:ml-0 ml-auto"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      {roleOptions.length > 1 && (
        <select
          value={roleId}
          onChange={(e) => onRoleChange?.(e.target.value)}
          className="hidden h-9 shrink-0 rounded-xl border border-border bg-card px-2 text-xs font-medium text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring sm:block"
          aria-label="Switch role"
        >
          {roleOptions.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      )}

      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-card py-1 pl-1 pr-3">
        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg gradient-primary text-xs font-semibold text-primary-foreground">
          {user.photo ? (
            <AuthImg src={photoSrc(user.photo)} alt={user.name} className="size-full object-cover" />
          ) : (
            user.avatar
          )}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-foreground">{user.name}</p>
          <p className="text-[10px] text-muted-foreground">{user.role}</p>
        </div>
      </div>

      <button
        onClick={() => setLogoutOpen(true)}
        className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Logout"
      >
        <LogOut className="size-5" />
      </button>

      <FloatingModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Logout"
        description="Are you sure you want to logout?"
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLogoutOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmLogout}>Logout</Button>
        </div>
      </FloatingModal>
    </header>
  );
}