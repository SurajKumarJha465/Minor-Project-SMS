import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ArrowRight } from "lucide-react";
import { getAssignedCourses, deptName, sectionLabel } from "@/features/Teacher/lib/academic-data";
import { DepartmentPicker, SemesterPicker, SectionPicker, DrillBreadcrumb, type DrillState } from "@/features/Teacher/components/DrillNav";

export const Route = createFileRoute("/teacher/attendance/")({
  head: () => ({ meta: [{ title: "Attendance · Teacher Portal" }] }),
  component: AttendanceIndex,
});

function AttendanceIndex() {
  const [state, setState] = useState<DrillState>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground">Select a department, semester and section to begin taking attendance.</p>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Card key={c.id} className="group rounded-2xl border-border/60 shadow-soft transition hover:-translate-y-1 hover:shadow-glass">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{c.code}</div>
                <CardTitle className="mt-1 truncate text-base">{c.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="rounded-full">{c.enrolled}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/teacher/attendance/$courseId" params={{ courseId: c.id }}>
                <Button className="w-full rounded-xl">
                  <Camera className="mr-2 h-4 w-4" /> Take Attendance
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
