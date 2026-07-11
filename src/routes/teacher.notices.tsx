import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Search, Paperclip, CalendarDays, Eye } from "lucide-react";

export const Route = createFileRoute("/teacher/notices")({
  head: () => ({ meta: [{ title: "Notice · Teacher Portal" }] }),
  component: NoticesPage,
});

const notices = [
  {
    title: "Guest Lecture: Transformers in NLP",
    type: "Course",
    audience: "CS-501",
    published: "July 8, 2026",
    description: "A guest lecture on Transformer architectures and their applications in NLP will be held for CS-501 students. Attendance is optional but strongly encouraged for those pursuing ML electives next semester.",
    attachment: "transformers-session-brief.pdf",
  },
  {
    title: "Assignment 4 deadline extended",
    type: "Course",
    audience: "CS-402",
    published: "July 9, 2026",
    description: "The submission deadline for Assignment 4 (Trees & Graphs) has been extended by 3 days due to multiple student requests. New deadline is Friday, 11:59 PM.",
    attachment: null,
  },
  {
    title: "Department seminar on IoT",
    type: "Department",
    audience: "Computer Engg.",
    published: "July 6, 2026",
    description: "The Computer Engineering department is organizing a seminar on Internet of Things applications in smart campuses. All faculty and students are welcome to attend.",
    attachment: "iot-seminar-agenda.pdf",
  },
  {
    title: "Library resource access",
    type: "General",
    audience: "All students",
    published: "July 4, 2026",
    description: "Updated instructions for accessing digital library resources and journal databases from off-campus have been published on the student portal.",
    attachment: null,
  },
];

function NoticesPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<(typeof notices)[number] | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.audience.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Notice</h1>
        <p className="text-sm text-muted-foreground">View notices published by the college and department.</p>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notice Board</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notices…"
              className="h-9 w-56 rounded-lg pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No notices match your search.</p>
          )}
          {filtered.map((n, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-semibold">{n.title}</div>
                  <Badge variant="secondary" className="rounded-full text-[10px]">{n.type}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.audience} · {n.published}</div>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 rounded-lg" onClick={() => setActive(n)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{active.type}</Badge>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">{active.audience}</Badge>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</div>
                  <p className="mt-1 text-sm leading-relaxed">{active.description}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Published {active.published}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Attachment</div>
                  {active.attachment ? (
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-border p-2.5 text-sm">
                      <Paperclip className="h-4 w-4 text-muted-foreground" /> {active.attachment}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">No attachment</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
