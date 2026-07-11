import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarRange, BookOpen, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { semesters, department } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/semesters")({
  head: () => ({ meta: [{ title: "Semester Management · HOD" }] }),
  component: Semesters,
});

type SemesterInfo = (typeof semesters)[number];

function Semesters() {
  const [viewSem, setViewSem] = useState<SemesterInfo | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Semester Management</h1>
        <p className="text-sm text-muted-foreground">View department semesters, courses and assigned teachers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {semesters.map((s) => (
          <Card key={s.id} className="rounded-2xl shadow-soft">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <CalendarRange className="h-5 w-5" />
                </div>
                {s.status === "active"
                  ? <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Active</Badge>
                  : <Badge variant="secondary" className="rounded-lg">Upcoming</Badge>}
              </div>
              <div>
                <div className="font-display text-lg font-bold">Semester {s.number}</div>
                <div className="text-xs text-muted-foreground">{s.year}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> {s.courses} courses</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {s.students} students</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setViewSem(s)}>
                  <Eye className="mr-1 h-3 w-3" /> View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!viewSem} onOpenChange={(o) => !o && setViewSem(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          {viewSem && (
            <>
              <DialogHeader>
                <DialogTitle>Semester {viewSem.number}</DialogTitle>
                <DialogDescription>{viewSem.year}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <Row label="Semester Number" value={String(viewSem.number)} />
                <Row label="Department" value={department} />
                <Row label="Total Students" value={String(viewSem.students)} />
                <Row label="Total Courses" value={String(viewSem.courses)} />
                <Row label="Assigned Teachers" value={viewSem.assignedTeachers.length ? viewSem.assignedTeachers.join(", ") : "None"} />
                <div>
                  <div className="mb-1.5 text-muted-foreground">Course List</div>
                  <ul className="space-y-1.5 rounded-xl border border-border/60 p-3">
                    {viewSem.courseList.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{c.name} <span className="text-muted-foreground">({c.code})</span></span>
                        <span className="text-muted-foreground">{c.teacher ?? "Unassigned"}</span>
                      </li>
                    ))}
                    {viewSem.courseList.length === 0 && <li className="text-xs text-muted-foreground">No courses yet.</li>}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewSem(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
