import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Users, GraduationCap, BookOpen, CalendarRange, Megaphone, ArrowRight,
  ChevronRight, Mail, Phone, LayoutGrid, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/StatCard";
import {
  hod, teachers, hodStudents, hodCourses, semesters, sections,
  getStudentsBySemesterSection, type Section,
} from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/dashboard")({
  head: () => ({ meta: [{ title: "HOD Dashboard · Comp. Engg." }] }),
  component: HodDashboard,
});

function HodDashboard() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [semModalOpen, setSemModalOpen] = useState(false);
  const semOverviewRef = useRef<HTMLDivElement>(null);

  function scrollToOverview() {
    setTimeout(() => semOverviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function pickSemester(n: number) {
    setSelectedSem(n);
    setSelectedSection(null);
  }

  function pickSemesterFromModal(n: number) {
    setSemModalOpen(false);
    pickSemester(n);
    scrollToOverview();
  }

  const statCards = [
    { key: "teachers", label: "Total Teachers", value: teachers.length, delta: "active faculty", tone: "primary", icon: Users },
    { key: "students", label: "Total Students", value: hodStudents.length, delta: "across 8 semesters", tone: "accent", icon: GraduationCap },
    { key: "courses", label: "Total Courses", value: hodCourses.length, delta: "this session", tone: "info", icon: BookOpen },
    { key: "semesters", label: "Total Semesters", value: semesters.length, delta: "Sem 1 – 8", tone: "success", icon: CalendarRange },
  ] as const;

  const sectionStudents = selectedSem && selectedSection
    ? getStudentsBySemesterSection(hodStudents, selectedSem, selectedSection)
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="relative overflow-hidden rounded-2xl border-0 gradient-brand p-0 text-white shadow-glass">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(600px 200px at 90% -20%, #fff, transparent 60%)" }} />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-white/80">{today}</div>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
              Welcome back, {hod.title} {hod.name.split(" ").slice(-1)[0]} 👋
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              Head of <b className="text-white">{hod.department}</b> · {hod.session}. You have <b className="text-white">{hodCourses.filter(c => !c.teacher).length} courses</b> without an assigned teacher.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/hod/notices">
                <Button size="sm" variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Megaphone className="mr-1.5 h-4 w-4" /> Publish Notice
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-widest text-white/70">Department Snapshot</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center justify-between gap-6"><span>Teachers</span><b>{teachers.length}</b></li>
                <li className="flex items-center justify-between gap-6"><span>Students</span><b>{hodStudents.length}</b></li>
                <li className="flex items-center justify-between gap-6"><span>Active Courses</span><b>{hodCourses.length}</b></li>
                <li className="flex items-center justify-between gap-6"><span>Semesters</span><b>{semesters.length}</b></li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((a) => (
          <StatCard key={a.key} label={a.label} value={a.value} delta={a.delta} icon={a.icon} tone={a.tone as any} />
        ))}
      </div>

      {/* Quick actions */}
      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <button
            onClick={() => setSemModalOpen(true)}
            className="group flex w-full max-w-xs items-center gap-3 rounded-xl border border-border bg-background/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-brand text-white shadow-soft">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 text-sm font-medium">View Semester</div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </button>
        </CardContent>
      </Card>

      {/* Semester overview / drilldown */}
      <div ref={semOverviewRef}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Semester Overview</CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <button
                  onClick={() => { setSelectedSem(null); setSelectedSection(null); }}
                  className={selectedSem ? "hover:text-primary hover:underline" : "font-semibold text-foreground"}
                >
                  All Semesters
                </button>
                {selectedSem && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <button
                      onClick={() => setSelectedSection(null)}
                      className={selectedSection ? "hover:text-primary hover:underline" : "font-semibold text-foreground"}
                    >
                      Semester {selectedSem}
                    </button>
                  </>
                )}
                {selectedSection && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-semibold text-foreground">Section {selectedSection}</span>
                  </>
                )}
              </div>
            </div>
            {(selectedSem !== null) && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={() => (selectedSection ? setSelectedSection(null) : setSelectedSem(null))}
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Back
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedSem === null && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                {semesters.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSemester(s.number)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                      <CalendarRange className="h-5 w-5" />
                    </div>
                    <div className="font-display text-sm font-bold">Semester {s.number}</div>
                    <div className="text-[11px] text-muted-foreground">{s.students} students</div>
                  </button>
                ))}
              </div>
            )}

            {selectedSem !== null && selectedSection === null && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {sections.map((sec) => {
                  const count = getStudentsBySemesterSection(hodStudents, selectedSem, sec).length;
                  return (
                    <button
                      key={sec}
                      onClick={() => setSelectedSection(sec)}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-background/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft font-display text-sm font-bold">
                        {sec}
                      </div>
                      <div>
                        <div className="font-display text-sm font-bold">Section {sec}</div>
                        <div className="text-[11px] text-muted-foreground">{count} students</div>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSem !== null && selectedSection !== null && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Enrollment #</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionStudents.map((s) => (
                      <tr key={s.id} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={s.photo} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                            <div className="font-semibold">{s.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{s.enrollment}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {s.email}</span></td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {s.phone}</span></td>
                      </tr>
                    ))}
                    {sectionStudents.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">No students in this section.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Semester modal */}
      <Dialog open={semModalOpen} onOpenChange={setSemModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Semester</DialogTitle>
            <DialogDescription>Select a semester to view its sections and students.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 pt-2">
            {semesters.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="h-14 flex-col gap-0.5 rounded-xl text-xs"
                onClick={() => pickSemesterFromModal(s.number)}
              >
                <span className="font-display text-base font-bold">{s.number}</span>
                <span className="text-[10px] text-muted-foreground">Sem</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
