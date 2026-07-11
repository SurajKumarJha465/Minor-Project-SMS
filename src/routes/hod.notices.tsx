import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Pin, Paperclip, Send, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { departmentNotices } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/notices")({
  head: () => ({ meta: [{ title: "Department Notices · HOD" }] }),
  component: Notices,
});

const typeColor: Record<string, string> = {
  Exam: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Department: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Semester: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  Emergency: "bg-destructive/15 text-destructive",
};

function Notices() {
  const [type, setType] = useState("Department");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Department Notice Board</h1>
        <p className="text-sm text-muted-foreground">Publish and manage department announcements.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3"><CardTitle className="text-base">Create Notice</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Notice Type</label>
              <div className="flex flex-wrap gap-2">
                {["Department","Semester","Exam","Emergency"].map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="h-10 rounded-xl" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write your notice here…" className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-xl"><Paperclip className="mr-1.5 h-4 w-4" /> Attach</Button>
              <Button variant="outline" className="rounded-xl"><CalendarClock className="mr-1.5 h-4 w-4" /> Schedule</Button>
              <Button className="ml-auto rounded-xl gradient-brand text-white"><Send className="mr-1.5 h-4 w-4" /> Publish</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Notice History</CardTitle>
            <span className="text-xs text-muted-foreground">4 unread</span>
          </CardHeader>
          <CardContent className="space-y-2">
            {departmentNotices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:shadow-soft">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-brand text-white">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{n.title}</div>
                    {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    <Badge className={`rounded-lg ${typeColor[n.type]}`}>{n.type}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{n.audience} · {n.author} · {n.date}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
