import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, GraduationCap, ShieldCheck, TrendingUp, UserCheck } from "lucide-react";

import AttributeCard from "@/features/Student/ui/AttributeCard";
import ChartCard from "@/features/Student/ui/ChartCard";
import SectionCard from "@/features/Student/ui/SectionCard";
import ProgressBar from "@/features/Student/ui/ProgressBar";
import Button from "@/features/Student/ui/Button";
import Pill from "@/features/Student/ui/Pill";
import { CHART, tooltipStyle } from "@/features/Student/lib/chart-colors";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Pokhara University's official 4.0-scale letter grades, in rank order —
// https://pu.edu.np/examination/academic-system/ (undergraduate level).
// Matches api/grading.py's GRADE_POINTS table exactly, so a distribution
// built from this always lines up with what the transcript says. PU's
// scale doesn't have a distinct "A+" tier (A already tops out at 4.0), so
// any A+ a course record carries is folded into the A bucket.
const GRADE_ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
const normalizeGrade = (g) => (g === "A+" ? "A" : g);

// PU's published undergraduate CGPA thresholds — same source as above.
function puStanding(cgpa) {
  if (cgpa <= 0) return { label: "No published results yet", tone: "neutral", note: null };
  if (cgpa >= 3.7) return { label: "Dean's List", tone: "success", note: "CGPA 3.70+ qualifies for the Dean's List." };
  if (cgpa >= 3.6) return { label: "Distinction", tone: "success", note: "CGPA 3.60+ qualifies for a degree with distinction." };
  if (cgpa >= 2.0) return { label: "Good Standing", tone: "primary", note: "Minimum CGPA to continue in the programme is 2.00." };
  return { label: "Below Minimum CGPA", tone: "danger", note: "PU requires a CGPA of at least 2.00 to remain in good standing." };
}

export default function GpaAnalytics() {
  const [results, setResults] = useState(null); // { cgpa, results, courses_by_semester }
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = { ...authHeader() };
        const [resultsRes, coursesRes, attRes] = await Promise.all([
          fetch(`${API_URL}/api/student/results`, { headers }),
          fetch(`${API_URL}/api/student/courses`, { headers }),
          fetch(`${API_URL}/api/student/attendance`, { headers }),
        ]);
        if (!resultsRes.ok) throw new Error(`Failed to load results (${resultsRes.status})`);
        if (!coursesRes.ok) throw new Error(`Failed to load courses (${coursesRes.status})`);
        if (!attRes.ok) throw new Error(`Failed to load attendance (${attRes.status})`);

        const [resultsData, courseList, attData] = await Promise.all([
          resultsRes.json(), coursesRes.json(), attRes.json(),
        ]);
        if (cancelled) return;
        setResults(resultsData);
        setCourses(courseList);
        setAttendance(attData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your academic data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const semResults = results?.results ?? [];
  const coursesBySemester = results?.courses_by_semester ?? {};
  const cgpa = results?.cgpa ?? 0;
  const standing = puStanding(cgpa);

  const bestSgpa = useMemo(
    () => (semResults.length ? Math.max(...semResults.map((s) => s.gpa)) : 0),
    [semResults],
  );
  const totalCredits = useMemo(() => semResults.reduce((a, s) => a + s.credits, 0), [semResults]);

  // Cumulative CGPA-to-date alongside each semester's own SGPA — both
  // derived the same credit-weighted way api/grading.py computes the
  // official cgpa, just exposed one semester at a time instead of only
  // the final number.
  const gpaTrend = useMemo(() => {
    let cumPoints = 0;
    let cumCredits = 0;
    return semResults.map((s) => {
      cumPoints += s.gpa * s.credits;
      cumCredits += s.credits;
      return {
        name: `Sem ${s.semester}`,
        sgpa: s.gpa,
        cgpa: cumCredits ? Math.round((cumPoints / cumCredits) * 100) / 100 : 0,
      };
    });
  }, [semResults]);

  // Letter-grade distribution across every course in a fully Published
  // semester. Semesters still pending publication are left out, same rule
  // Semester Results follows for anything course-level.
  const gradeDistribution = useMemo(() => {
    const counts = Object.fromEntries(GRADE_ORDER.map((g) => [g, 0]));
    for (const s of semResults) {
      if (s.status !== "Published") continue;
      for (const c of coursesBySemester[s.semester] ?? []) {
        const g = normalizeGrade(c.grade);
        if (g in counts) counts[g] += 1;
      }
    }
    return GRADE_ORDER.map((g) => ({ name: g, count: counts[g] }));
  }, [semResults, coursesBySemester]);

  // Current-semester internal marks as a % of 50 — same figures Courses.jsx
  // and the Dashboard show, just grouped here for a course-by-course view.
  const coursePerformance = useMemo(
    () => courses.map((c) => ({ name: c.code, score: Math.round((c.internal / (c.internal_max || 50)) * 100) })),
    [courses],
  );

  const hasResults = semResults.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">GPA Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading…" : `Cumulative CGPA ${cgpa.toFixed(2)} on Pokhara University's 4.0 scale.`}
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && !loading && !hasResults && (
        <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          No published results yet — analytics will appear once your first semester grades are published.
        </p>
      )}

      {!error && hasResults && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AttributeCard icon={GraduationCap} label="Current CGPA" value={cgpa.toFixed(2)} tone="primary" />
            <AttributeCard icon={Award} label="Best SGPA" value={bestSgpa.toFixed(2)} tone="success" />
            <AttributeCard icon={UserCheck} label="Attendance" value={`${attendance?.summary?.overall ?? 0}%`} tone="info" />
            <AttributeCard icon={TrendingUp} label="Credits Earned" value={totalCredits} tone="mist" />
          </div>

          {/* Academic standing — PU's own published thresholds, not a
              fabricated "performance score" or class rank (no backend
              support exists yet for comparing against classmates). */}
          <SectionCard title="Academic Standing" icon={ShieldCheck}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-foreground">{standing.label}</p>
                {standing.note && <p className="text-xs text-muted-foreground">{standing.note}</p>}
              </div>
              <p className="text-sm text-muted-foreground">{cgpa.toFixed(2)} / 4.00</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={(cgpa / 4) * 100} showValue={false} tone={standing.tone === "danger" ? "danger" : "primary"} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              PU undergraduate thresholds: 2.00 minimum to continue · 3.60 for distinction · 3.70 for the Dean's List.
            </p>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="SGPA vs Cumulative CGPA" icon={TrendingUp}>
              <LineChart data={gpaTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 4]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="sgpa" name="Semester GPA" stroke={CHART.c1} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cgpa" name="Cumulative CGPA" stroke={CHART.c3} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Grade Distribution" icon={Award} subtitle="Published semesters only">
              <BarChart data={gradeDistribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
                <Bar dataKey="count" fill={CHART.c2} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          {!!coursePerformance.length && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Internal Marks by Course" icon={Award} subtitle="This semester, % of 50">
                <BarChart layout="vertical" data={coursePerformance} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={48} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
                  <Bar dataKey="score" fill={CHART.c1} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartCard>

              <SectionCard
                title="Course Progress"
                icon={TrendingUp}
                subtitle="This semester"
                action={<Pill tone="warning">Coming Soon</Pill>}
              >
                <div className="space-y-4 opacity-50" aria-disabled="true">
                  {coursePerformance.map((c) => (
                    <ProgressBar key={c.name} value={c.score} label={c.name} tone={c.score >= 80 ? "success" : "primary"} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Per-course syllabus progress tracking is on its way — these bars currently mirror your internal
                  marks and aren't real progress data yet.
                </p>
              </SectionCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}