import { cn } from "@/lib/utils";

/**
 * SectionCard — titled surface used to group content (charts, tables, lists).
 */
export default function SectionCard({ title, subtitle, icon: Icon, action, className, bodyClassName, children }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-soft transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate font-display text-sm font-semibold text-foreground">{title}</h3>}
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
