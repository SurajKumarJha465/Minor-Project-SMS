import { cn } from "@/lib/utils";

/**
 * NavPill — a single navigation entry used by the Student sidebar.
 * Renders an icon + label and highlights when active.
 */
export default function NavPill({ icon: Icon, label, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        collapsed && "justify-center",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            active ? "" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
      )}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
