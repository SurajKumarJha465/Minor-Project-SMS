import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Eye, Building2, ChevronRight, ArrowLeft, GraduationCap,
  Mail, Phone, MapPin, Users, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { saStudents, departmentList } from "@/lib/superadmin-mock-data";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "View Students · Super Admin" }] }),
  component: StudentsPage,
});

type Student = (typeof saStudents)[number];

function StudentsPage() {
  const [dept, setDept] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [viewTarget, setViewTarget] = useState<Student | null>(null);

  const deptCounts = useMemo(
    () => Object.fromEntries(departmentList.map((d) => [d, saStudents.filter((s) => s.department === d).length])),
    [],
  );

  const semesterCounts = useMemo(() => {
    if (!dept) return {};
    const counts: Record<number, number> = {};
    for (let s = 1; s <= 8; s++) counts[s] = saStudents.filter((st) => st.department === dept && st.semester === s).length;
    return counts;
  }, [dept]);

  const rows = useMemo(() => {
    if (!dept || !semester) return [];
    return saStudents
      .filter((s) => s.department === dept && s.semester === semester)
      .filter((s) => (s.name + s.enrollment + s.email).toLowerCase().includes(q.toLowerCase()));
  }, [dept, semester, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">View Students</h1>
          <p className="text-sm text-muted-foreground">
            {!dept && "Select a department to browse students."}
            {dept && !semester && `Select a semester in ${dept}.`}
            {dept && semester && `${dept} · Semester ${semester}`}
          </p>
        </div>
        {(dept || semester) && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => (semester ? setSemester(null) : setDept(null))}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {/* Step 1: Department cards */}
      {!dept && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departmentList.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/60 p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glass"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <Building2 className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
              <div>
                <div className="font-display text-base font-bold">{d}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {deptCounts[d]} students
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Semester cards */}
      {dept && !semester && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => {
            const s = i + 1;
            return (
              <button
                key={s}
                onClick={() => setSemester(s)}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/60 p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glass"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="font-display text-lg font-bold">Semester {s}</div>
                <div className="text-xs text-muted-foreground">{semesterCounts[s] ?? 0} students</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 3: Student table */}
      {dept && semester && (
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base">Students ({rows.length})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search students…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Photo</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Enrollment No.</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={s.photo} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                      </td>
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.enrollment}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View" onClick={() => setViewTarget(s)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          {viewTarget && (
            <>
              <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={viewTarget.photo} /><AvatarFallback>{viewTarget.name[0]}</AvatarFallback></Avatar>
                <div>
                  <div className="text-lg font-semibold">{viewTarget.name}</div>
                  <div className="text-xs text-muted-foreground">{viewTarget.enrollment}</div>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <DetailRow icon={Building2} label="Department" value={viewTarget.department} />
                <DetailRow icon={GraduationCap} label="Semester" value={`Semester ${viewTarget.semester}`} />
                <DetailRow icon={Users} label="Batch" value={viewTarget.batch} />
                <DetailRow icon={Mail} label="Email" value={viewTarget.email} />
                <DetailRow icon={Phone} label="Phone" value={viewTarget.phone} />
                <DetailRow icon={MapPin} label="Address" value={viewTarget.address} />
                <DetailRow icon={Users} label="Guardian" value={`${viewTarget.guardianName} · ${viewTarget.guardianPhone}`} />
                <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> Courses Enrolled
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewTarget.coursesEnrolled.map((c) => <Badge key={c} variant="secondary" className="rounded-lg">{c}</Badge>)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setViewTarget(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-medium">{value}</div>
      </div>
    </div>
  );
}
