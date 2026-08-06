import { cn } from "@/lib/utils";

const TONES = {
  primary: "gradient-primary",
  info: "gradient-sky",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

/**
 * ProgressBar — labelled animated progress indicator.
 */
export default function ProgressBar({ value = 0, tone = "primary", label, showValue = true, size = "md", className }) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-muted-foreground">{label}</span>}
          {showValue && <span className="font-semibold text-foreground">{clamped}%</span>}
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", height)}>
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", TONES[tone] ?? TONES.primary)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
