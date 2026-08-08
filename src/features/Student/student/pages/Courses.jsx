import { useEffect, useState } from "react";
import { BookOpen, FolderOpen, GraduationCap, UserRound } from "lucide-react";

import ProgressBar from "@/features/Student/ui/ProgressBar";
import Pill from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Course model has no "color" concept — cycle a fixed palette by position
// so cards stay visually distinct, same as the old mock data did.
const COLOR_CYCLE = ["primary", "info", "success", "warning"];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/courses`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
        const data = await res.json();
        if (!cancelled) setCourses(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const totalCredits = courses.reduce((a, c) => a + c.credits, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">My Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading…" : `${courses.length} courses enrolled this semester · ${totalCredits} total credits`}
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && !loading && courses.length === 0 && (
        <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          You aren't enrolled in any courses yet.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c, i) => (
          <div
            key={c.id}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl gradient-mist text-primary">
                <BookOpen className="size-5" />
              </span>
              <Pill tone={COLOR_CYCLE[i % COLOR_CYCLE.length]} dot>{c.credits} credits</Pill>
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-foreground">{c.name}</h3>
            <p className="text-xs text-muted-foreground">{c.code}</p>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="size-3.5" /> {c.teacher}
            </div>

            <div className="mt-4 space-y-3">
              <ProgressBar value={c.attendance} tone="success" size="sm" label="Attendance" />
              <div className="flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="size-3.5" /> Internal Marks
                </span>
                <span className="font-semibold text-foreground">{c.internal}/{c.internal_max}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewCourse(c)}>
                View Details
              </Button>
              <Button size="sm" variant="ghost" disabled title="Resources coming soon">
                <FolderOpen className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* View course details */}
      <FloatingModal
        open={!!viewCourse}
        onClose={() => setViewCourse(null)}
        title={viewCourse?.name}
        description={viewCourse?.code}
      >
        {viewCourse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Course Code</p>
                <p className="font-semibold text-foreground">{viewCourse.code}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Credit Hours</p>
                <p className="font-semibold text-foreground">{viewCourse.credits}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="font-semibold text-foreground">{viewCourse.attendance}%</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Internal Marks</p>
                <p className="font-semibold text-foreground">{viewCourse.internal}/{viewCourse.internal_max}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Teacher</p>
                <p className="font-semibold text-foreground">{viewCourse.teacher}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled title="Resources coming soon">
                <FolderOpen className="size-4" /> View Resources
              </Button>
              <Button variant="ghost" onClick={() => setViewCourse(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}