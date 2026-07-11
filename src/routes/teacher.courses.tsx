import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { getAssignedCourses, deptName, sectionLabel } from "@/features/Teacher/lib/academic-data";
import { DepartmentPicker, SemesterPicker, SectionPicker, DrillBreadcrumb, type DrillState } from "@/features/Teacher/components/DrillNav";

export const Route = createFileRoute("/teacher/courses")({
  head: () => ({ meta: [{ title: "My Courses · Teacher Portal" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const [state, setState] = useState<DrillState>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Select a department, semester and section to view your assigned courses.</p>
        </div>
      </div>

      <DrillBreadcrumb state={state} onNavigate={setState} />

      {!state.dept && <DepartmentPicker onSelect={(dept) => setState({ dept })} />}
      {state.dept && !state.sem && <SemesterPicker onSelect={(sem) => setState({ dept: state.dept, sem })} />}
      {state.dept && state.sem && !state.section && (
        <SectionPicker onSelect={(section) => setState({ ...state, section })} />
      )}
      {state.dept && state.sem && state.section && (
        <AssignedCourses dept={state.dept} sem={state.sem} section={state.section} />
      )}
    </div>
  );
}

function AssignedCourses({ dept, sem, section }: { dept: string; sem: number; section: string }) {
  const list = getAssignedCourses(dept, sem, section);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full">{deptName(dept)}</Badge>
        <Badge variant="secondary" className="rounded-full">Semester {sem}</Badge>
        <Badge variant="secondary" className="rounded-full">Section {sectionLabel(section)}</Badge>
        <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">{list.length} courses</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Card key={c.id} className="group overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass">
            <div className="gradient-brand relative h-24 p-4 text-white">
              <div className="text-[10px] uppercase tracking-widest opacity-80">{deptName(dept)}</div>
              <div className="mt-1 font-display text-lg font-bold">{c.name}</div>
              <div className="absolute right-4 top-4 rounded-lg bg-white/15 px-2 py-1 font-mono text-xs backdrop-blur">{c.code}</div>
            </div>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <Stat label="Credit Hours" value={c.credits} />
                <Stat label="Attendance" value={`${c.attendance}%`} />
              </div>
              <div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Attendance</span><span className="font-semibold">{c.attendance}%</span></div>
                <Progress value={c.attendance} className="mt-1 h-1.5" />
              </div>
              <Button size="sm" className="w-full rounded-lg text-xs" onClick={() => toast(`${c.name} · ${c.code} · ${c.credits} credit hours · ${c.attendance}% attendance`)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold">{value}</div>
    </div>
  );
}
