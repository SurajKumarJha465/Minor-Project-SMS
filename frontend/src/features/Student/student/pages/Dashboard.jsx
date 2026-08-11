import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BellRing,
  BookOpen,
  GraduationCap,
  ListChecks,
  Paperclip,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import AttributeCard from "@/features/Student/ui/AttributeCard";
import ChartCard from "@/features/Student/ui/ChartCard";
import SectionCard from "@/features/Student/ui/SectionCard";
import Button from "@/features/Student/ui/Button";
import Pill from "@/features/Student/ui/Pill";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { CHART, tooltipStyle } from "@/features/Student/lib/chart-colors";
import { apiJson } from "@/lib/api";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Same convention as NoticeBoard.jsx: the backend returns a relative
// /uploads/notices/<file> path that needs the API origin prefixed.
function attachmentSrc(url) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Same category → colour mapping NoticeBoard.jsx uses, so a notice looks the
// same whether you see it here or on the full board.
const CAT_TONE = { Department: "primary", Semester: "info", Exam: "warning", Emergency: "danger" };

const QUICK_ACTIONS = [
  { label: "View Attendance", icon: UserCheck, page: "attendance" },
  { label: "View Marks", icon: ListChecks, page: "internal-marks" },
  { label: "Download Result", icon: BookOpen, page: "semester-results" },
  { label: "Open Notices", icon: BellRing, page: "notice-board" },
];

const formatToday = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// The backend only tracks attendance day-by-day (no monthly rollup), so the
// "trend" chart is built here from the raw calendar: bucket days into weeks
// and take the % present per week, most recent 8 weeks.
function buildWeeklyAttendanceTrend(calendar) {
  if (!calendar?.length) return [];
  const buckets = new Map();
  for (const day of calendar) {
    const d = new Date(day.date);
    if (Number.isNaN(d.getTime())) continue;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday of that week
    const key = weekStart.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { present: 0, total: 0 };
    bucket.total += 1;
    if (day.status === "present") bucket.present += 1;
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-8)
    .map(([key, b]) => ({
      name: new Date(key).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      value: Math.round((b.present / b.total) * 100),
    }));
}

export default function Dashboard({ onNavigate }) {
  const [today, setToday] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(null);

  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setToday(formatToday()), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [me, att, courseList, resultsData, noticeList] = await Promise.all([
          apiJson("/api/student/me"),
          apiJson("/api/student/attendance"),
          apiJson("/api/student/courses"),
          apiJson("/api/student/results"),
          apiJson("/api/student/notices"),
        ]);

        if (cancelled) return;
        setProfile(me);
        setAttendance(att);
        setCourses(courseList);
        setResults(resultsData);
        setNotices(noticeList);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { icon: UserCheck, label: "Attendance", value: attendance ? `${attendance.summary.overall}%` : "—", tone: "primary" },
    { icon: TrendingUp, label: "CGPA", value: results ? results.cgpa : "—", tone: "info" },
    { icon: BookOpen, label: "Courses Enrolled", value: courses.length, tone: "mist" },
    { icon: GraduationCap, label: "Semester", value: profile ? profile.semester : "—", tone: "mist" },
  ];

  const weeklyAttendanceTrend = useMemo(
    () => buildWeeklyAttendanceTrend(attendance?.calendar),
    [attendance],
  );

  const semesterGpaTrend = useMemo(
    () => (results?.results ?? []).map((r) => ({ name: `Sem ${r.semester}`, gpa: r.gpa })),
    [results],
  );

  const coursePerformance = useMemo(
    () => courses.map((c) => ({ name: c.code, score: Math.round((c.internal / (c.internal_max || 50)) * 100) })),
    [courses],
  );

  const quickNotices = notices.slice(0, 4);
  const firstName = profile?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-primary-foreground shadow-glow sm:p-8">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 right-24 size-48 rounded-full bg-white/5 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 text-primary-foreground">
            <p className="text-sm font-medium opacity-80">{today}</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back{firstName ? `, ${firstName}` : ""}! 👋
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              {profile
                ? `Semester ${profile.semester} · ${profile.department} · Enrollment ${profile.enrollment}`
                : loading
                  ? "Loading your details…"
                  : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur">
            <div className="text-primary-foreground">
              <p className="text-xs opacity-80">Current CGPA</p>
              <p className="font-display text-2xl font-bold">{results ? results.cgpa : "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <AttributeCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      {/* Quick actions */}
      <SectionCard title="Quick Actions" icon={ListChecks}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.page)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <span className="grid size-11 place-items-center rounded-xl gradient-mist text-primary transition-transform group-hover:scale-110">
                <a.icon className="size-5" />
              </span>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Attendance Trend" subtitle="Weekly average %" icon={TrendingUp}>
          <AreaChart data={weeklyAttendanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.c1} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.c1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={CHART.c1} strokeWidth={2.5} fill="url(#attGrad)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Semester GPA Progress" subtitle="GPA across semesters" icon={GraduationCap}>
          <LineChart data={semesterGpaTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="gpa" stroke={CHART.c2} strokeWidth={2.5} dot={{ r: 4, fill: CHART.c2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Course Performance" subtitle="Internal marks %" icon={BookOpen}>
          <BarChart data={coursePerformance} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
              {coursePerformance.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? CHART.c1 : CHART.c3} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        {/* Quick Notices */}
        <SectionCard title="Quick Notices" icon={BellRing} action={<Button variant="ghost" size="sm" onClick={() => onNavigate("notice-board")}>View all</Button>}>
          <div className="space-y-3">
            {quickNotices.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {loading ? "Loading…" : "No notices yet."}
              </p>
            )}
            {quickNotices.map((n) => (
              <div key={n.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                    {n.attachment_url && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary">
                        <Paperclip className="size-3" /> {n.attachment_name}
                      </span>
                    )}
                  </div>
                  <Pill tone={CAT_TONE[n.type] ?? "neutral"}>{n.type}</Pill>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{n.date}</span>
                  <Button size="sm" variant="outline" onClick={() => setNoticeOpen(n)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Notice detail modal */}
      <FloatingModal
        open={!!noticeOpen}
        onClose={() => setNoticeOpen(null)}
        title={noticeOpen?.title}
        description={noticeOpen ? `${noticeOpen.audience} · ${noticeOpen.author} · ${noticeOpen.date}` : ""}
      >
        {noticeOpen && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm text-foreground">{noticeOpen.body}</p>
            {noticeOpen.attachment_url && (
              <a
                href={attachmentSrc(noticeOpen.attachment_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-primary hover:underline"
              >
                <Paperclip className="size-3.5" />
                {noticeOpen.attachment_name}
                {noticeOpen.attachment_size != null && (
                  <span className="text-muted-foreground">({formatBytes(noticeOpen.attachment_size)})</span>
                )}
              </a>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={CAT_TONE[noticeOpen.type] ?? "neutral"} dot>{noticeOpen.type}</Pill>
              {noticeOpen.pinned && <Pill tone="danger">Pinned</Pill>}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setNoticeOpen(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}