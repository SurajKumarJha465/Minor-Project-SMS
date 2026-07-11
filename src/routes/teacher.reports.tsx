import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileBarChart, Download, FileSpreadsheet, PartyPopper } from "lucide-react";
import { getAssignedCourses, getRosterFor, deptName, sectionLabel } from "@/lib/academic-data";
import { DepartmentPicker, SemesterPicker, SectionPicker, DrillBreadcrumb, type DrillState } from "@/components/DrillNav";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · Teacher Portal" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [state, setState] = useState<DrillState>({});
  const [courseId, setCourseId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Select a department, semester, section and course to generate its internal marks report.</p>
      </div>

      {!courseId && (
        <>
          <DrillBreadcrumb state={state} onNavigate={setState} />
          {!state.dept && <DepartmentPicker onSelect={(dept) => setState({ dept })} />}
          {state.dept && !state.sem && <SemesterPicker onSelect={(sem) => setState({ dept: state.dept, sem })} />}
          {state.dept && state.sem && !state.section && (
            <SectionPicker onSelect={(section) => setState({ ...state, section })} />
          )}
          {state.dept && state.sem && state.section && (
            <CourseList dept={state.dept} sem={state.sem} section={state.section} onSelect={setCourseId} />
          )}
        </>
      )}

      {courseId && <InternalMarksReport courseId={courseId} onBack={() => setCourseId(null)} />}
    </div>
  );
}

function CourseList({ dept, sem, section, onSelect }: { dept: string; sem: number; section: string; onSelect: (id: string) => void }) {
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
          <Card
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
          >
            <div className="gradient-brand relative h-20 p-4 text-white">
              <div className="text-[10px] uppercase tracking-widest opacity-80">{c.code}</div>
              <div className="mt-1 font-display text-base font-bold">{c.name}</div>
            </div>
            <CardContent className="flex items-center justify-between p-4 text-sm">
              <span className="text-xs text-muted-foreground">{c.enrolled} students</span>
              <span className="text-xs font-medium text-primary">Generate report →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InternalMarksReport({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [dept, semStr, section] = courseId.split("-");
  const sem = Number(semStr);
  const course = getAssignedCourses(dept, sem, section).find((c) => c.id === courseId);
  const roster = useMemo(() => getRosterFor(dept, sem, section), [dept, sem, section]);

  const [generated, setGenerated] = useState(false);
  const [successKind, setSuccessKind] = useState<"excel" | "pdf" | null>(null);

  if (!course) return <p className="text-sm text-muted-foreground">Course not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course.code}</div>
          <h2 className="font-display text-xl font-bold">{course.name} · Internal Marks Report</h2>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-brand text-white"><FileBarChart className="h-5 w-5" /></div>
          <div className="min-w-0">
            <CardTitle className="text-base">Internal Marks Report</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{roster.length} students · {course.code} · {deptName(dept)}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!generated ? (
            <Button className="rounded-xl" onClick={() => setGenerated(true)}>
              <FileBarChart className="mr-1.5 h-4 w-4" />Generate Report
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setSuccessKind("excel")}>
                <FileSpreadsheet className="mr-1.5 h-4 w-4" />Download Excel
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setSuccessKind("pdf")}>
                <Download className="mr-1.5 h-4 w-4" />Download PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!successKind} onOpenChange={(v) => !v && setSuccessKind(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-emerald-500" />
              {successKind === "excel" ? "Excel report generated" : "PDF report generated"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {course.name} internal marks report has been downloaded as {successKind === "excel" ? ".xlsx" : ".pdf"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessKind(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
