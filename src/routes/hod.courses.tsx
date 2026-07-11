import { createFileRoute } from "@tanstack/react-router";
import { Plus, BookOpen, Users, Pencil, Eye, BarChart3, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hodCourses } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/courses")({
  head: () => ({ meta: [{ title: "Course Management · HOD" }] }),
  component: Courses,
});

function Courses() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Course Management</h1>
          <p className="text-sm text-muted-foreground">All courses under Computer Engineering.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white"><Plus className="mr-1.5 h-4 w-4" /> Create Course</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hodCourses.map((c) => (
          <Card key={c.id} className="group rounded-2xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="rounded-lg">Sem {c.sem}</Badge>
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground">{c.code}</div>
                <div className="font-display text-base font-bold leading-tight">{c.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Credits" value={c.credits} />
                <Stat label="Enrolled" value={c.enrolled} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-mono font-bold text-primary">{c.completion}%</span>
                </div>
                <Progress value={c.completion} className="h-2" />
              </div>
              <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{c.teacher}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs"><UserPlus className="mr-1 h-3 w-3" /> Assign</Button>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs"><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs"><Eye className="mr-1 h-3 w-3" /> View</Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs"><BarChart3 className="mr-1 h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold">{value}</div>
    </div>
  );
}
