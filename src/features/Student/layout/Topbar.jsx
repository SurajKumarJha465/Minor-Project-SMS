import { useState } from "react";
import { ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import FloatingModal from "@/components/ui/FloatingModal";
import Button from "@/components/ui/Button";

/**
 * Topbar — breadcrumb, global search, theme toggle, profile and logout.
 */
export default function Topbar({
  breadcrumb = [],
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  user = { name: "Sumit Verma", role: "Student", avatar: "SV" },
  roleId,
  roleOptions = [],
  onRoleChange,
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
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search…"
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring"
        />
      </div>

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
        <div className="grid size-8 place-items-center rounded-lg gradient-primary text-xs font-semibold text-primary-foreground">
          {user.avatar}
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
