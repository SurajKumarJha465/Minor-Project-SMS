import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, CircleUserRound, Download, UserCheck, UserX } from "lucide-react";

import AttributeCard from "@/features/Student/ui/AttributeCard";
import SectionCard from "@/features/Student/ui/SectionCard";
import ProgressBar from "@/features/Student/ui/ProgressBar";
import Pill from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import { downloadFile } from "@/lib/utils";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const DAY_STYLE = {
  present: "bg-success/15 text-success",
  absent: "bg-destructive/12 text-destructive",
  none: "bg-muted text-muted-foreground/50",
};
const LEGEND = [
  { label: "Present", key: "present" },
  { label: "Absent", key: "absent" },
  { label: "No class / no record", key: "none" },
];
const attStatusTone = (s) => (s === "Excellent" ? "success" : s === "Good" ? "info" : "warning");

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/attendance`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load attendance (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load attendance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const summary = data?.summary ?? { overall: 0, total_classes: 0, present: 0, absent: 0 };
  const courses = data?.courses ?? [];
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(`${API_URL}/api/student/attendance/report`, { ...authHeader() }, "attendance-report.pdf");
      toast.success("Attendance report downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the report.");
    } finally {
      setDownloading(false);
    }
  };

  // The real "now" the calendar starts on. Frozen once on mount so the
  // "current month" boundary doesn't shift under the user mid-session.
  const [today] = useState(() => new Date());

  // Which month is being viewed, as a count of months back from `today`.
  // 0 = current month, 1 = previous month, etc.
  const [monthsBack, setMonthsBack] = useState(0);

  // Earliest month that actually has attendance data, derived from the
  // calendar rollup the backend already sends (no extra API calls needed).
  const earliestMonth = useMemo(() => {
    const dates = (data?.calendar ?? []).map((d) => d.date);
    if (dates.length === 0) return null;
    const earliest = dates.reduce((a, b) => (a < b ? a : b));
    const [y, m] = earliest.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [data]);

  const viewedDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - monthsBack, 1),
    [today, monthsBack],
  );
  const viewedYear = viewedDate.getFullYear();
  const viewedMonth = viewedDate.getMonth();

  const canGoNext = monthsBack > 0;
  const canGoPrev =
    !earliestMonth ||
    viewedYear > earliestMonth.year ||
    (viewedYear === earliestMonth.year && viewedMonth > earliestMonth.month);

  const goPrevMonth = () => canGoPrev && setMonthsBack((n) => n + 1);
  const goNextMonth = () => canGoNext && setMonthsBack((n) => Math.max(0, n - 1));

  // Build a calendar grid for the viewed month, marking each day from the
  // real day-level rollup the backend computed (present / absent / no record).
  const monthCells = useMemo(() => {
    const byDate = new Map((data?.calendar ?? []).map((d) => [d.date, d.status]));
    const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    const firstWeekday = new Date(viewedYear, viewedMonth, 1).getDay();

    const cells = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = new Date(viewedYear, viewedMonth, day).toISOString().slice(0, 10);
      cells.push({ day, status: byDate.get(iso) ?? "none" });
    }
    return cells;
  }, [data, viewedYear, viewedMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `Overall attendance ${summary.overall}% across ${summary.total_classes} classes.`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !!error || downloading}
          onClick={handleDownload}
        >
          <Download className="size-4" /> {downloading ? "Downloading…" : "Download Report"}
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <AttributeCard icon={CalendarCheck} label="Overall" value={`${summary.overall}%`} tone="primary" />
        <AttributeCard icon={UserCheck} label="Present" value={summary.present} tone="success" />
        <AttributeCard icon={UserX} label="Absent" value={summary.absent} tone="mist" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Calendar */}
        <SectionCard title="Monthly Calendar" subtitle="Colour-coded daily attendance" icon={CalendarDays} className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {LEGEND.map((l) => (
                <span key={l.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-3 rounded-full ${DAY_STYLE[l.key]}`} /> {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTH_FORMATTER.format(viewedDate)}
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="py-1">{d}</span>
            ))}
            {monthCells.map((c, i) =>
              c ? (
                <div
                  key={i}
                  title={c.status}
                  className={`grid aspect-square place-items-center rounded-lg text-xs font-semibold ${DAY_STYLE[c.status]}`}
                >
                  {c.day}
                </div>
              ) : (
                <div key={i} />
              ),
            )}
          </div>
        </SectionCard>

        {/* Course-wise progress */}
        <SectionCard title="Course-wise %" icon={CircleUserRound} className="lg:col-span-2">
          <div className="space-y-4">
            {!loading && courses.length === 0 && (
              <p className="text-sm text-muted-foreground">No enrolled courses found.</p>
            )}
            {courses.map((c) => (
              <div key={c.course_id}>
                <ProgressBar
                  value={c.percentage}
                  tone={c.percentage >= 90 ? "success" : c.percentage >= 75 ? "primary" : "warning"}
                  label={c.code}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Course-wise table */}
      <SectionCard title="Course-wise Attendance" icon={UserCheck} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Teacher</th>
                <th className="px-5 py-3 font-medium">Present</th>
                <th className="px-5 py-3 font-medium">Absent</th>
                <th className="px-5 py-3 font-medium">Attendance %</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {!loading && courses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No enrolled courses found.
                  </td>
                </tr>
              )}
              {courses.map((c) => (
                <tr key={c.course_id} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.teacher}</td>
                  <td className="px-5 py-3 text-success">{c.present}</td>
                  <td className="px-5 py-3 text-destructive">{c.absent}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.percentage} showValue={false} size="sm" className="w-24" tone={c.percentage >= 90 ? "success" : "primary"} />
                      <span className="text-xs font-semibold text-foreground">{c.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Pill tone={attStatusTone(c.status)} dot>{c.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}