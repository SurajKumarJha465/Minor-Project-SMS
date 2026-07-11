import { cn } from "@/lib/utils";

/**
 * Timeline — vertical activity feed. Each item: { icon, title, detail, time, tone }.
 */
const TONES = {
  primary: "bg-primary/12 text-primary",
  info: "bg-info/15 text-info-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
};

export default function Timeline({ items = [], className }) {
  return (
    <ol className={cn("relative space-y-5", className)}>
      {items.map((item, i) => (
        <li key={item.id ?? i} className="relative flex gap-3.5">
          {/* connector */}
          {i !== items.length - 1 && (
            <span className="absolute left-[18px] top-10 h-[calc(100%-8px)] w-px bg-border" aria-hidden />
          )}
          <span
            className={cn(
              "z-10 grid size-9 shrink-0 place-items-center rounded-full",
              TONES[item.tone] ?? TONES.primary,
            )}
          >
            {item.icon && <item.icon className="size-4" />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.detail && <p className="truncate text-xs text-muted-foreground">{item.detail}</p>}
            {item.time && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{item.time}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
