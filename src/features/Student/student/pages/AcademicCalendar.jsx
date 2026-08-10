import { useEffect, useMemo, useState } from "react";
import {
  Award, Bell, CalendarDays, ChevronLeft, ChevronRight, FileText, GraduationCap, PartyPopper, Users,
} from "lucide-react";

import SectionCard from "@/features/Student/ui/SectionCard";
import Pill from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Mirrors the EventType enum on the backend (see hod.calendar.tsx, which
// manages these events — students only ever view them).
const TYPE = {
  Exam: { tone: "danger", icon: GraduationCap },
  Deadline: { tone: "warning", icon: FileText },
  Meeting: { tone: "info", icon: Users },
  Event: { tone: "primary", icon: Bell },
  Holiday: { tone: "success", icon: PartyPopper },
  Result: { tone: "primary", icon: Award },
};
const DOT_CLASS = {
  danger: "bg-destructive", warning: "bg-warning", info: "bg-info", success: "bg-success", primary: "bg-primary",
};
const ICON_WRAP_CLASS = {
  danger: "bg-destructive/12 text-destructive",
  warning: "bg-warning/20 text-warning-foreground",
  info: "bg-info/15 text-info-foreground",
  success: "bg-success/15 text-success",
  primary: "bg-primary/12 text-primary",
};

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AcademicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/calendar`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load calendar (${res.status})`);
        const data = await res.json();
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the calendar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayStr = todayISODate();

  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const list = map.get(d.getDate()) ?? [];
        list.push(e);
        map.set(d.getDate(), list);
      }
    }
    return map;
  }, [events, year, month]);

  const upcoming = useMemo(
    () => events.filter((e) => e.date.slice(0, 10) >= todayStr).sort((a, b) => a.date.localeCompare(b.date)),
    [events, todayStr],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Academic Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Exams, deadlines, holidays and events at a glance.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      {!error && (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Month grid */}
          <SectionCard
            title={monthLabel}
            icon={CalendarDays}
            className="lg:col-span-3"
            action={
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            }
          >
            <div className="mb-3 flex flex-wrap gap-3">
              {Object.entries(TYPE).map(([label, v]) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-2.5 rounded-full ${DOT_CLASS[v.tone]}`} /> {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
              {cells.map((day, i) => {
                if (day === null) return <span key={`e${i}`} />;
                const dayEvents = eventsByDay.get(day) ?? [];
                const isToday = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === todayStr;
                const primary = dayEvents[0] ? TYPE[dayEvents[0].type] : null;
                return (
                  <div
                    key={day}
                    title={dayEvents.map((e) => e.title).join(", ")}
                    className={`relative grid aspect-square place-items-center rounded-lg text-xs font-semibold ${
                      dayEvents.length ? "gradient-mist text-primary" : "text-foreground hover:bg-accent/50"
                    } ${isToday ? "ring-2 ring-primary" : ""}`}
                  >
                    {day}
                    {primary && (
                      <span className={`absolute bottom-1 size-1.5 rounded-full ${DOT_CLASS[primary.tone]}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Upcoming schedule */}
          <SectionCard title="Upcoming Schedule" icon={Bell} className="lg:col-span-2" bodyClassName="p-3">
            <div className="space-y-2">
              {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
              {!loading && upcoming.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>
              )}
              {upcoming.map((e) => {
                const t = TYPE[e.type] ?? TYPE.Event;
                const Icon = t.icon;
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${ICON_WRAP_CLASS[t.tone]}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.display_date}</p>
                    </div>
                    <Pill tone={t.tone}>{e.type}</Pill>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}