import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const toneMap: Record<string, string> = {
  primary: "from-[#293681] to-[#4274D9] text-white",
  accent: "from-[#4274D9] to-[#95CCDD] text-white",
  info: "from-[#4274D9] to-[#293681] text-white",
  success: "from-emerald-500 to-teal-500 text-white",
  warning: "from-amber-500 to-orange-500 text-white",
};

export function StatCard({
  label, value, delta, icon: Icon, tone = "primary",
}: {
  label: string; value: React.ReactNode; delta?: string; icon: LucideIcon; tone?: keyof typeof toneMap;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/60 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glass">
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-90", toneMap[tone])} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</div>
          {delta && <div className="mt-1 text-xs font-medium text-muted-foreground">{delta}</div>}
        </div>
        <div className={cn("z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-soft", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
