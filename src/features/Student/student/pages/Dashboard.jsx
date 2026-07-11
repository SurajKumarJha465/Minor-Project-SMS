import { toast } from "sonner";
import { useEffect, useState } from "react";
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
  Download,
  GraduationCap,
  ListChecks,
  Paperclip,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import AttributeCard from "@/components/ui/AttributeCard";
import ChartCard from "@/components/ui/ChartCard";
import SectionCard from "@/components/ui/SectionCard";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import FloatingModal from "@/components/ui/FloatingModal";
import { CHART, tooltipStyle } from "@/lib/chart-colors";
import {
  attendanceTrend,
  coursePerformance,
  notices,
  quickStats,
  semesterGpaTrend,
  studentProfile,
} from "@/data/mock/student";

const CAT_TONE = { Important: "danger", Academic: "info", Department: "primary", Exam: "warning" };

const QUICK_ACTIONS = [
  { label: "View Attendance", icon: UserCheck, page: "attendance" },
  { label: "View Marks", icon: ListChecks, page: "internal-marks" },
  { label: "Download Result", icon: Download, page: "semester-results" },
  { label: "Open Notices", icon: BellRing, page: "notice-board" },
];

const formatToday = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Dashboard({ onNavigate }) {
  const [today, setToday] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(null);
  useEffect(() => setToday(formatToday()), []);

  const stats = [
    { icon: UserCheck, label: "Attendance", value: `${quickStats.attendance}%`, tone: "primary" },
    { icon: TrendingUp, label: "CGPA", value: studentProfile.cgpa, tone: "info" },
    { icon: BookOpen, label: "Courses Enrolled", value: quickStats.coursesEnrolled, tone: "mist" },
    { icon: GraduationCap, label: "Semester Progress", value: `${quickStats.semesterProgress}%`, tone: "mist" },
  ];

  const quickNotices = notices.slice(0, 4);

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
              Welcome back, {studentProfile.firstName}! 👋
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              Semester {studentProfile.semester} · {studentProfile.department} · Enrollment {studentProfile.enrollment}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur">
            <div className="text-primary-foreground">
              <p className="text-xs opacity-80">Current CGPA</p>
              <p className="font-display text-2xl font-bold">{studentProfile.cgpa}</p>
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
        <ChartCard title="Attendance Trend" subtitle="Monthly average %" icon={TrendingUp}>
          <AreaChart data={attendanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.c1} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART.c1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[70, 100]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={CHART.c1} strokeWidth={2.5} fill="url(#attGrad)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Semester GPA Progress" subtitle="GPA across semesters" icon={GraduationCap}>
          <LineChart data={semesterGpaTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[7, 10]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="gpa" stroke={CHART.c2} strokeWidth={2.5} dot={{ r: 4, fill: CHART.c2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Course Performance" subtitle="Score % per course" icon={BookOpen}>
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
            {quickNotices.map((n) => (
              <div key={n.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.summary}</p>
                  </div>
                  <Pill tone={n.priority === "High" ? "danger" : "neutral"}>{n.priority}</Pill>
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
        description={noticeOpen ? `${noticeOpen.category} · ${noticeOpen.date}` : ""}
      >
        {noticeOpen && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">{noticeOpen.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={CAT_TONE[noticeOpen.category]} dot>{noticeOpen.category}</Pill>
              <Pill tone={noticeOpen.priority === "High" ? "danger" : "neutral"}>{noticeOpen.priority} priority</Pill>
            </div>
            {noticeOpen.attachment && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-accent/30 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-foreground"><Paperclip className="size-4" /> {noticeOpen.attachment}</span>
                <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloading ${noticeOpen.attachment}`)}>Download</Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setNoticeOpen(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
