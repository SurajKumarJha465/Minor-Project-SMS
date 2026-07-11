import { cn } from "@/lib/utils";

const TONES = {
  primary: "gradient-primary text-primary-foreground",
  info: "gradient-sky text-info-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  mist: "gradient-mist text-primary",
};

/**
 * AttributeCard — gradient analytics / stat card.
 */
export default function AttributeCard({ icon: Icon, label, value, hint, tone = "mist", className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated",
        TONES[tone] ?? TONES.mist,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
        </div>
        {Icon && (
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/25 backdrop-blur">
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}
