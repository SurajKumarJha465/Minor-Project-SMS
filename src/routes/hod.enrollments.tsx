import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authHeader } from "@/lib/auth";
import { sectionLabel } from "@/features/HoD/lib/hod-mock-data";
import { Search, UserPlus, UserMinus, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const Route = createFileRoute("/hod/enrollments")({
  head: () => ({ meta: [{ title: "Enrollments · HOD" }] }),
  component: Enrollments,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type CourseOpt = { id: string; code: string; name: string; sem: number; section: string };
type RosterStudent = {
  id: string; name: string; enrollment: string; semester: number; section: string;
  photo: string | null; enrolled: boolean;
};

function Enrollments() {
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // load course list once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/hod/courses`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setCourses(data);
          if (data.length) setCourseId(data[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load courses.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // load roster whenever the selected course changes
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/hod/courses/${courseId}/roster`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load roster (${res.status})`);
        const data = await res.json();
        if (!cancelled) setRoster(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load roster.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId]);

  const selectedCourse = courses.find((c) => c.id === courseId) ?? null;
  const rows = roster.filter((s) => (s.name + s.enrollment).toLowerCase().includes(q.toLowerCase()));
  const enrolledCount = roster.filter((s) => s.enrolled).length;

  async function toggle(student: RosterStudent) {
    setBusyId(student.id);
    try {
      const res = student.enrolled
        ? await fetch(`${API_URL}/api/hod/courses/${courseId}/enrollments/${student.id}`, {
            method: "DELETE", headers: { ...authHeader() },
          })
        : await fetch(`${API_URL}/api/hod/courses/${courseId}/enrollments`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ student_id: student.id }),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to update enrollment");
        return;
      }
      setRoster((prev) => prev.map((s) => (s.id === student.id ? { ...s, enrolled: !student.enrolled } : s)));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Enrollments</h1>
          <p className="text-sm text-muted-foreground">Manage which students are enrolled in each course.</p>
        </div>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="h-9 w-64 rounded-xl"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} · {c.name} (Sem {c.sem})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {selectedCourse ? `${selectedCourse.code} · Sec ${sectionLabel(selectedCourse.section)}` : "No course selected"}
            </CardTitle>
            {selectedCourse && (
              <div className="mt-1 text-xs text-muted-foreground">
                {enrolledCount} enrolled · {roster.length} eligible (Sem {selectedCourse.sem})
              </div>
            )}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <div className="px-1 py-6 text-center text-sm text-muted-foreground">Loading roster…</div>}
          {!loading && rows.length === 0 && (
            <div className="px-1 py-6 text-center text-sm text-muted-foreground">No students found.</div>
          )}
          {!loading && rows.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={s.photo ?? undefined} />
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{s.name}</div>
                  <Badge variant="secondary" className="rounded-lg font-mono text-[10px]">{s.enrollment}</Badge>
                  <Badge variant="outline" className="rounded-lg">Sec {sectionLabel(s.section)}</Badge>
                </div>
              </div>
              {s.enrolled ? (
                <Button
                  size="sm" variant="outline" className="h-9 rounded-lg text-destructive"
                  disabled={busyId === s.id} onClick={() => toggle(s)}
                >
                  <UserMinus className="mr-1 h-4 w-4" /> Unenroll
                </Button>
              ) : (
                <Button
                  size="sm" className="h-9 rounded-lg gradient-brand text-white"
                  disabled={busyId === s.id} onClick={() => toggle(s)}
                >
                  <UserPlus className="mr-1 h-4 w-4" /> Enroll
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}