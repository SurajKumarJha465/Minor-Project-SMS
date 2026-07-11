import { BookMarked, CalendarDays, FileText, PartyPopper, Sparkles } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import Pill from "@/components/ui/Pill";
import { calendarEvents } from "@/data/mock/student";

const TYPE = {
  exam: { tone: "danger", icon: FileText, label: "Exam" },
  assignment: { tone: "warning", icon: BookMarked, label: "Assignment" },
  event: { tone: "primary", icon: Sparkles, label: "Event" },
  holiday: { tone: "success", icon: PartyPopper, label: "Holiday" },
};

// Simple month grid (July 2026) with event markers.
const daysInMonth = 31;
const firstWeekday = 2; // Wed
const eventDays = calendarEvents
  .filter((e) => e.date.includes("Jul"))
  .map((e) => ({ day: parseInt(e.date, 10), type: e.type, title: e.title }));

export default function AcademicCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Academic Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Exams, deadlines, holidays and events at a glance.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Month grid */}
        <SectionCard title="July 2026" icon={CalendarDays} className="lg:col-span-3">
          <div className="mb-3 flex flex-wrap gap-3">
            {Object.entries(TYPE).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2.5 rounded-full ${
                  v.tone === "danger" ? "bg-destructive" : v.tone === "warning" ? "bg-warning" : v.tone === "success" ? "bg-success" : "bg-primary"
                }`} /> {v.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
            {Array.from({ length: firstWeekday }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ev = eventDays.find((e) => e.day === day);
              const t = ev ? TYPE[ev.type] : null;
              return (
                <div
                  key={day}
                  title={ev?.title}
                  className={`relative grid aspect-square place-items-center rounded-lg text-xs font-semibold ${
                    ev ? "gradient-mist text-primary" : "text-foreground hover:bg-accent/50"
                  }`}
                >
                  {day}
                  {t && (
                    <span className={`absolute bottom-1 size-1.5 rounded-full ${
                      t.tone === "danger" ? "bg-destructive" : t.tone === "warning" ? "bg-warning" : t.tone === "success" ? "bg-success" : "bg-primary"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Upcoming schedule */}
        <SectionCard title="Upcoming Schedule" icon={Sparkles} className="lg:col-span-2" bodyClassName="p-3">
          <div className="space-y-2">
            {calendarEvents.map((e, i) => {
              const t = TYPE[e.type];
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    t.tone === "danger" ? "bg-destructive/12 text-destructive" : t.tone === "warning" ? "bg-warning/20 text-warning-foreground" : t.tone === "success" ? "bg-success/15 text-success" : "bg-primary/12 text-primary"
                  }`}>
                    <t.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                  </div>
                  <Pill tone={t.tone}>{t.label}</Pill>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
