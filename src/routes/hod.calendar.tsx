import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, FileText, Users, Bell, PartyPopper, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calendarEvents } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/calendar")({
  head: () => ({ meta: [{ title: "Academic Calendar · HOD" }] }),
  component: CalendarPage,
});

const typeIcon: Record<string, any> = {
  Exam: GraduationCap, Deadline: FileText, Meeting: Users, Event: Bell, Holiday: PartyPopper, Result: Award,
};

function CalendarPage() {
  const today = new Date();
  const month = today.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Academic Calendar</h1>
        <p className="text-sm text-muted-foreground">Semester schedule, exams, meetings and holidays.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{month}</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const isToday = d === today.getDate();
                const hasEvent = d && [10, 15, 18, 22].includes(d);
                return (
                  <div key={i} className={`aspect-square rounded-lg border p-1.5 text-xs transition ${d ? "border-border/60 bg-background/50 hover:bg-muted" : "border-transparent"} ${isToday ? "border-primary bg-primary/10 font-bold text-primary" : ""}`}>
                    <div className="flex h-full flex-col justify-between">
                      <span>{d ?? ""}</span>
                      {hasEvent && <div className="h-1 w-1 self-end rounded-full bg-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3"><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {calendarEvents.map((e, i) => {
              const Icon = typeIcon[e.type] ?? Bell;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-brand text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-sm">{e.title}</div>
                      <Badge variant="secondary" className="rounded-lg">{e.type}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{e.date}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
