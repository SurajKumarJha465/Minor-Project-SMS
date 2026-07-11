import { cn } from "@/lib/utils";

/**
 * Pill — small rounded status / label badge.
 * tone maps to a semantic token pair.
 */
const TONES = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/12 text-primary",
  info: "bg-info/15 text-info-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/12 text-destructive",
};

export default function Pill({ tone = "neutral", dot = false, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps a free-text status to a Pill tone. */
export function statusTone(status) {
  switch (status) {
    case "Active":
    case "Published":
      return "success";
    case "Pending":
    case "Scheduled":
    case "Upcoming":
      return "warning";
    case "Inactive":
    case "Draft":
      return "neutral";
    default:
      return "primary";
  }
}
