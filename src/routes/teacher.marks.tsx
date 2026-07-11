import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getAssignedCourses, getRosterFor, deptName, sectionLabel } from "@/lib/academic-data";
import { DepartmentPicker, SemesterPicker, SectionPicker, DrillBreadcrumb, type DrillState } from "@/components/DrillNav";

export const Route = createFileRoute("/_app/marks")({
  head: () => ({ meta: [{ title: "Internal Marks · Teacher Portal" }] }),
  component: MarksPage,
});

const PRACTICAL = [
  { key: "pAtt", label: "Attendance & Participation", weight: "10%", max: 2 },
  { key: "pLab", label: "Lab / Project Report", weight: "20%", max: 4 },
  { key: "pExam", label: "Practical Exam / Project Work", weight: "40%", max: 8 },
  { key: "pViva", label: "Viva", weight: "30%", max: 6 },
] as const;

const THEORY = [
  { key: "tAtt", label: "Attendance & Participation", weight: "10%", max: 3 },
  { key: "tAssign", label: "Assignment", weight: "20%", max: 6 },
  { key: "tPresent", label: "Presentation", weight: "10%", max: 3 },
  { key: "tAssess", label: "Internal Assessment", weight: "60%", max: 18 },
] as const;

const ALL_FIELDS = [...PRACTICAL, ...THEORY];

function seedValue(max: number, i: number) {
  return Math.round(max * (0.6 + ((i * 7) % 30) / 100));
}

function MarksPage() {
  const [state, setState] = useState<DrillState>({});
  const [courseId, setCourseId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Internal Marks</h1>
        <p className="text-sm text-muted-foreground">Select a department, semester, section and course to enter marks. Maximum 50 marks per student.</p>
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

      {courseId && <StudentMarks courseId={courseId} onBack={() => setCourseId(null)} />}
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
              <span className="text-xs font-medium text-primary">Enter marks →</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentMarks({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [dept, semStr, section] = courseId.split("-");
  const sem = Number(semStr);
  const course = getAssignedCourses(dept, sem, section).find((c) => c.id === courseId);
  const roster = useMemo(() => getRosterFor(dept, sem, section), [dept, sem, section]);

  const [rows, setRows] = useState(() =>
    roster.map((s, i) => {
      const rec: Record<string, number> = {};
      ALL_FIELDS.forEach((f) => { rec[f.key] = seedValue(f.max, i); });
      return { ...s, ...rec };
    }),
  );
  const [publishOpen, setPublishOpen] = useState(false);

  const update = (id: string, field: string, max: number, val: number) => {
    const clamped = Math.max(0, Math.min(max, val));
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: clamped } : x)));
  };

  function publish() {
    setPublishOpen(false);
    toast.success("Marks Published Successfully");
  }

  if (!course) return <p className="text-sm text-muted-foreground">Course not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="rounded-xl" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{course.code}</div>
            <h2 className="font-display text-xl font-bold">{course.name} · Internal Marks</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Draft Saved Successfully")}>
            <Save className="mr-1.5 h-4 w-4" />Save Draft
          </Button>
          <Button className="rounded-xl" onClick={() => setPublishOpen(true)}>
            <Send className="mr-1.5 h-4 w-4" />Publish
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Practical (20) · Theory (30) · Total (50)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="[&>th]:px-3 [&>th]:py-3 [&>th]:text-left">
                  <th rowSpan={2} className="align-bottom">Student</th>
                  <th colSpan={4} className="text-center">Practical (20)</th>
                  <th colSpan={4} className="text-center">Theory (30)</th>
                  <th rowSpan={2} className="align-bottom text-center">Practical<br/>Total</th>
                  <th rowSpan={2} className="align-bottom text-center">Theory<br/>Total</th>
                  <th rowSpan={2} className="align-bottom text-center">Final /50</th>
                </tr>
                <tr className="[&>th]:px-2 [&>th]:pb-2 [&>th]:text-center">
                  {PRACTICAL.map((f) => <th key={f.key} title={f.label}>{f.max}</th>)}
                  {THEORY.map((f) => <th key={f.key} title={f.label}>{f.max}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const practicalTotal = PRACTICAL.reduce((sum, f) => sum + (s as any)[f.key], 0);
                  const theoryTotal = THEORY.reduce((sum, f) => sum + (s as any)[f.key], 0);
                  const final = practicalTotal + theoryTotal;
                  return (
                    <tr key={s.id} className="[&>td]:px-2 [&>td]:py-2">
                      <td className="px-3">
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.enrollment}</div>
                      </td>
                      {ALL_FIELDS.map((f) => (
                        <td key={f.key}>
                          <Input
                            type="number"
                            min={0}
                            max={f.max}
                            value={(s as any)[f.key]}
                            onChange={(e) => update(s.id, f.key, f.max, +e.target.value)}
                            className="h-9 w-14 rounded-lg text-center"
                          />
                        </td>
                      ))}
                      <td className="text-center font-mono text-sm font-semibold">{practicalTotal}</td>
                      <td className="text-center font-mono text-sm font-semibold">{theoryTotal}</td>
                      <td className="text-center">
                        <span className="rounded-lg bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
                          {final}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Internal Marks?</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, marks for {course.name} will be visible to students. You can still edit drafts before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={publish}>Yes, Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
