import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";

import AttributeCard from "@/components/ui/AttributeCard";
import ChartCard from "@/components/ui/ChartCard";
import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import { CHART, tooltipStyle } from "@/lib/chart-colors";
import {
  attendanceTrend,
  coursePerformance,
  marksDistribution,
  performanceRadar,
  performanceScore,
  semesterGpaTrend,
} from "@/data/mock/student";

// attendance vs gpa composite series
const attVsGpa = semesterGpaTrend.map((s, i) => ({
  name: s.name,
  gpa: s.gpa,
  attendance: attendanceTrend[i]?.value ?? 90,
}));

export default function GpaAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">GPA Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visual insights into your academic performance.</p>
      </div>

      {/* Performance score + insight */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-sm opacity-85"><Sparkles className="size-4" /> Performance Score</p>
            <p className="mt-2 font-display text-5xl font-bold">{performanceScore.score}</p>
            <p className="mt-1 text-sm opacity-85">Rank {performanceScore.rank} of {performanceScore.totalStudents}</p>
          </div>
        </div>

        <SectionCard title="Motivational Insight" icon={Lightbulb} className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-foreground">{performanceScore.insight}</p>
          <div className="mt-4 space-y-2">
            {performanceScore.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-accent/40 px-3 py-2 text-sm text-foreground">
                <Target className="mt-0.5 size-4 shrink-0 text-primary" /> {s}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Semester GPA Trend" icon={TrendingUp}>
          <LineChart data={semesterGpaTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[7, 10]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="gpa" stroke={CHART.c1} strokeWidth={2.5} dot={{ r: 4, fill: CHART.c1 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Performance Radar" icon={Target}>
          <RadarChart data={performanceRadar} outerRadius="72%">
            <PolarGrid stroke={CHART.grid} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: CHART.axis, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Radar dataKey="score" stroke={CHART.c2} fill={CHART.c2} fillOpacity={0.35} strokeWidth={2} />
          </RadarChart>
        </ChartCard>

        <ChartCard title="Attendance vs GPA" icon={TrendingUp}>
          <LineChart data={attVsGpa} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="l" domain={[7, 10]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="r" orientation="right" domain={[70, 100]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line yAxisId="l" type="monotone" dataKey="gpa" stroke={CHART.c1} strokeWidth={2.5} dot={{ r: 3 }} name="GPA" />
            <Line yAxisId="r" type="monotone" dataKey="attendance" stroke={CHART.c3} strokeWidth={2.5} dot={{ r: 3 }} name="Attendance %" />
          </LineChart>
        </ChartCard>

        <ChartCard title="Marks Distribution" icon={Award}>
          <BarChart data={marksDistribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {marksDistribution.map((_, i) => (
                <Cell key={i} fill={[CHART.c1, CHART.c2, CHART.c3, CHART.c4][i % 4]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>

      {/* Course comparison + study progress */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Course Comparison" icon={Award}>
          <BarChart layout="vertical" data={coursePerformance} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={48} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
            <Bar dataKey="score" fill={CHART.c1} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartCard>

        <SectionCard title="Study Progress" icon={Target}>
          <div className="space-y-4">
            {coursePerformance.map((c) => (
              <ProgressBar key={c.name} value={c.score} label={c.name} tone={c.score >= 85 ? "success" : "primary"} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
