import { useState } from "react";
import { GraduationCap, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import NavPill from "@/components/ui/NavPill";
import FloatingModal from "@/components/ui/FloatingModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Sidebar — collapsible navigation rail driven by a nav manifest.
 */
export default function Sidebar({
  nav,
  activeId,
  onNavigate,
  collapsed,
  mobileOpen,
  onMobileClose,
  brandLabel = "Super Admin",
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = () => {
    setLogoutOpen(false);
    toast.success("Logged out successfully");
    // Redirect to the login page.
    window.location.href = "/login";
  };

  const content = (
    <div className="flex h-full flex-col gap-2 p-3">
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-2 py-3", collapsed && "justify-center")}>
        <div className="grid size-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold leading-tight text-sidebar-foreground">
              EduAdmin
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">{brandLabel}</p>
          </div>
        )}
        <button
          onClick={onMobileClose}
          className="ml-auto grid size-8 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.section} className="mt-2">
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.section}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavPill
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeId === item.id}
                  collapsed={collapsed}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-sidebar-border pt-2">
        <button
          onClick={() => setLogoutOpen(true)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive/90 transition-colors hover:bg-destructive/10",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar animate-in slide-in-from-left">
            {content}
          </aside>
        </div>
      )}

      {/* Logout confirmation */}
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
    </>
  );
}
