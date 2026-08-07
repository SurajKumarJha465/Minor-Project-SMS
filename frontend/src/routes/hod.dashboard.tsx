import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { StatCard } from "@/features/HoD/components/StatCard";
import { authHeader } from "@/lib/auth";

export const Route = createFileRoute("/hod/dashboard")({
  head: () => ({ meta: [{ title: "HOD Dashboard · Comp. Engg." }] }),
  component: HodDashboard,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type Section = string;

type HodProfile = {
  id: string;
  name: string;
  department: string;
  email: string;
  phone?: string | null;
};

type StudentRow = {
  id: string;
  name: string;
  enrollment: string;
  semester: number;
  section: string;
  department: string;
  photo?: string | null;
  email?: string | null;
  phone?: string | null;
};

type CourseRow = {
  id: string;
  code: string;
  name: string;
  sem: number;
  section: string;
  teacher_id: number | null;
};

type TeacherRow = {
  id: number;
  name: string;
};

const SEMESTER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

function getStudentsBySemesterSection(list: StudentRow[], semester: number, section: Section) {
  return list.filter((s) => s.semester === semester && s.section === section);
}

function HodDashboard() {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [profile, setProfile] = useState<HodProfile | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [semModalOpen, setSemModalOpen] = useState(false);
  const semOverviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [meRes, studentsRes, coursesRes, teachersRes] = await Promise.all([
          fetch(`${API_URL}/api/hod/me`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/students`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } }),
          fetch(`${API_URL}/api/hod/teachers`, { headers: { ...authHeader() } }),
        ]);
        if (!meRes.ok) throw new Error(`Failed to load profile (${meRes.status})`);
        if (!studentsRes.ok) throw new Error(`Failed to load students (${studentsRes.status})`);
        if (!coursesRes.ok) throw new Error(`Failed to load courses (${coursesRes.status})`);
        if (!teachersRes.ok) throw new Error(`Failed to load teachers (${teachersRes.status})`);

        const [meData, studentsData, coursesData, teachersData] = await Promise.all([
          meRes.json(), studentsRes.json(), coursesRes.json(), teachersRes.json(),
        ]);

        if (!cancelled) {
          setProfile(meData);
          setStudents(studentsData);
          setCourses(coursesData);
          setTeachers(teachersData);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  // Sections are derived from real data so the drilldown always matches what's
  // actually in the department, rather than a hardcoded list.
  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) if (s.section) set.add(s.section);
    for (const c of courses) if (c.section) set.add(c.section);
    return set.size > 0 ? Array.from(set).sort() : ["D", "M1", "M2"];
  }, [students, courses]);

  const semesterCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const s of students) counts.set(s.semester, (counts.get(s.semester) ?? 0) + 1);
    return counts;
  }, [students]);

  const unassignedCourses = courses.filter((c) => !c.teacher_id).length;

  const statCards = [
    { key: "teachers", label: "Total Teachers", value: teachers.length, delta: "active faculty", tone: "primary", icon: Users },
    { key: "students", label: "Total Students", value: students.length, delta: "across 8 semesters", tone: "accent", icon: GraduationCap },
    { key: "courses", label: "Total Courses", value: courses.length, delta: "this session", tone: "info", icon: BookOpen },
    { key: "semesters", label: "Total Semesters", value: SEMESTER_NUMBERS.length, delta: "Sem 1 – 8", tone: "success", icon: CalendarRange },
  ] as const;

  const sectionStudents = selectedSem && selectedSection
    ? getStudentsBySemesterSection(students, selectedSem, selectedSection)
    : [];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="relative overflow-hidden rounded-2xl border-0 gradient-brand p-0 text-white shadow-glass">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(600px 200px at 90% -20%, #fff, transparent 60%)" }} />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-white/80">{today}</div>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">
              Welcome back, {profile?.name?.split(" ").slice(-1)[0] ?? "there"} 👋
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              Head of <b className="text-white">{profile?.department ?? "—"}</b>. You have <b className="text-white">{unassignedCourses} courses</b> without an assigned teacher.
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
                <li className="flex items-center justify-between gap-6"><span>Students</span><b>{students.length}</b></li>
                <li className="flex items-center justify-between gap-6"><span>Active Courses</span><b>{courses.length}</b></li>
                <li className="flex items-center justify-between gap-6"><span>Semesters</span><b>{SEMESTER_NUMBERS.length}</b></li>
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
                {SEMESTER_NUMBERS.map((n) => (
                  <button
                    key={n}
                    onClick={() => pickSemester(n)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-background/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background hover:shadow-soft"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                      <CalendarRange className="h-5 w-5" />
                    </div>
                    <div className="font-display text-sm font-bold">Semester {n}</div>
                    <div className="text-[11px] text-muted-foreground">{semesterCounts.get(n) ?? 0} students</div>
                  </button>
                ))}
              </div>
            )}

            {selectedSem !== null && selectedSection === null && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {sections.map((sec) => {
                  const count = getStudentsBySemesterSection(students, selectedSem, sec).length;
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
                            <Avatar className="h-9 w-9"><AvatarImage src={s.photo ?? undefined} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
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
            {SEMESTER_NUMBERS.map((n) => (
              <Button
                key={n}
                variant="outline"
                className="h-14 flex-col gap-0.5 rounded-xl text-xs"
                onClick={() => pickSemesterFromModal(n)}
              >
                <span className="font-display text-base font-bold">{n}</span>
                <span className="text-[10px] text-muted-foreground">Sem</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}