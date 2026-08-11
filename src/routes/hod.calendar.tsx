import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, GraduationCap, FileText, Users, Bell, PartyPopper, Award,
  Plus, ChevronLeft, ChevronRight, Trash2, Pencil, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/calendar")({
  head: () => ({ meta: [{ title: "Academic Calendar · HOD" }] }),
  component: CalendarPage,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const EVENT_TYPES = ["Exam", "Deadline", "Meeting", "Event", "Holiday", "Result"] as const;
type EventType = (typeof EVENT_TYPES)[number];

type CalendarEvent = {
  id: number;
  title: string;
  type: EventType;
  date: string;         // ISO
  display_date: string; // "Aug 15, 2026"
};

const typeIcon: Record<string, any> = {
  Exam: GraduationCap, Deadline: FileText, Meeting: Users, Event: Bell, Holiday: PartyPopper, Result: Award,
};

function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDateFor(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  // Selected day on the grid — when set, the side panel shows that day's
  // events instead of the upcoming list, and Add Event defaults to it.
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Add-event dialog
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("Event");
  const [date, setDate] = useState(todayISODate());
  const [saving, setSaving] = useState(false);

  // Edit-event dialog
  const [editTarget, setEditTarget] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<EventType>("Event");
  const [editDate, setEditDate] = useState(todayISODate());
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadEvents() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/hod/events`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load the calendar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, []);

  function openAddDialog(prefillDate?: string) {
    setDate(prefillDate ?? todayISODate());
    setAddOpen(true);
  }

  function closeAddDialog() {
    setAddOpen(false);
    setTitle("");
    setType("Event");
    setDate(todayISODate());
  }

  async function submitNewEvent() {
    if (!title.trim() || !date) {
      toast.error("Give the event a title and a date.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ title: title.trim(), type, date: `${date}T00:00:00` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to add event");
        return;
      }
      const created: CalendarEvent = await res.json();
      setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      toast.success("Event added.");
      closeAddDialog();
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function openEditDialog(e: CalendarEvent) {
    setEditTarget(e);
    setEditTitle(e.title);
    setEditType(e.type);
    setEditDate(e.date.slice(0, 10));
  }

  function closeEditDialog() {
    setEditTarget(null);
  }

  async function submitEdit() {
    if (!editTarget) return;
    if (!editTitle.trim() || !editDate) {
      toast.error("Give the event a title and a date.");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/events/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ title: editTitle.trim(), type: editType, date: `${editDate}T00:00:00` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update event");
        return;
      }
      const updated: CalendarEvent = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)).sort((a, b) => a.date.localeCompare(b.date)));
      toast.success("Event updated.");
      closeEditDialog();
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/events/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to delete event");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = todayISODate();

  // Changing months invalidates whatever day was selected in the old month.
  function goToMonth(next: Date) {
    setViewDate(next);
    setSelectedDay(null);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventDaysThisMonth = useMemo(() => {
    const set = new Set<number>();
    for (const e of events) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) set.add(d.getDate());
    }
    return set;
  }, [events, year, month]);

  const upcoming = useMemo(
    () => events.filter((e) => e.date.slice(0, 10) >= todayStr).sort((a, b) => a.date.localeCompare(b.date)),
    [events, todayStr],
  );

  const selectedDateStr = selectedDay !== null ? isoDateFor(year, month, selectedDay) : null;
  const selectedDayEvents = useMemo(
    () => (selectedDateStr ? events.filter((e) => e.date.slice(0, 10) === selectedDateStr).sort((a, b) => a.date.localeCompare(b.date)) : []),
    [events, selectedDateStr],
  );
  const selectedDayLabel = selectedDateStr
    ? new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    : "";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading calendar…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button size="sm" variant="outline" onClick={loadEvents}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Academic Calendar</h1>
          <p className="text-sm text-muted-foreground">Semester schedule, exams, meetings and holidays.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white" onClick={() => openAddDialog(selectedDateStr ?? undefined)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{monthLabel}</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => goToMonth(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => goToMonth(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const isToday = d !== null && isoDateFor(year, month, d) === todayStr;
                const isSelected = d !== null && d === selectedDay;
                const hasEvent = d !== null && eventDaysThisMonth.has(d);
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={d === null}
                    onClick={() => setSelectedDay((prev) => (d !== null && prev === d ? null : d))}
                    className={`aspect-square rounded-lg border p-1.5 text-xs transition ${d ? "cursor-pointer border-border/60 bg-background/50 hover:bg-muted" : "cursor-default border-transparent"} ${isToday ? "border-primary font-bold text-primary" : ""} ${isSelected ? "bg-primary/15 ring-2 ring-primary" : isToday ? "bg-primary/10" : ""}`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <span>{d ?? ""}</span>
                      {hasEvent && <div className="h-1 w-1 self-end rounded-full bg-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3">
            {selectedDateStr ? (
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setSelectedDay(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{selectedDayLabel}</CardTitle>
              </div>
            ) : (
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {(selectedDateStr ? selectedDayEvents : upcoming).length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {selectedDateStr ? (
                  <>
                    <p>No events on this day.</p>
                    <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={() => openAddDialog(selectedDateStr)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add event on this day
                    </Button>
                  </>
                ) : (
                  <p>No upcoming events. Add one to get started.</p>
                )}
              </div>
            )}
            {(selectedDateStr ? selectedDayEvents : upcoming).map((e) => {
              const Icon = typeIcon[e.type] ?? Bell;
              return (
                <div key={e.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-brand text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-sm">{e.title}</div>
                      <Badge variant="secondary" className="rounded-lg">{e.type}</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{e.display_date}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-lg" onClick={() => openEditDialog(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-lg text-destructive" onClick={() => setDeleteTarget(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Add event dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => !o && closeAddDialog()}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>Add an exam, deadline, meeting or other event to the department calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mid-term Exams Begin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-type">Type</Label>
              <select
                id="event-type"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeAddDialog}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={saving} onClick={submitNewEvent}>
              {saving ? "Adding…" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit event dialog — same fields as Add, PATCHes the existing
          /api/hod/events/{id} endpoint that was already implemented on the
          backend but never called from this page. */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && closeEditDialog()}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update this event's title, type or date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-event-title">Title</Label>
              <Input id="edit-event-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Mid-term Exams Begin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-event-type">Type</Label>
              <select
                id="edit-event-type"
                value={editType}
                onChange={(e) => setEditType(e.target.value as EventType)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-event-date">Date</Label>
              <Input id="edit-event-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeEditDialog}>Cancel</Button>
            <Button className="rounded-xl gradient-brand text-white" disabled={editSaving} onClick={submitEdit}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be removed from the calendar.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}