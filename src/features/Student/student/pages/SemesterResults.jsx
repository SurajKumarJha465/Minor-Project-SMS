import { useState } from "react";
import { toast } from "sonner";
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
import { Award, Download, Eye, GraduationCap, TrendingUp } from "lucide-react";

import AttributeCard from "@/components/ui/AttributeCard";
import ChartCard from "@/components/ui/ChartCard";
import SectionCard from "@/components/ui/SectionCard";
import Pill, { statusTone } from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import FloatingModal from "@/components/ui/FloatingModal";
import { CHART, tooltipStyle } from "@/lib/chart-colors";
import { downloadMockPdf } from "@/lib/utils";
import { semesterCourseGrades, semesterGpaTrend, semesterResults, studentProfile } from "@/data/mock/student";

export default function SemesterResults() {
  const totalCredits = semesterResults.reduce((a, s) => a + s.credits, 0);
  const best = Math.max(...semesterResults.map((s) => s.gpa));
  const [viewSem, setViewSem] = useState(null);

  const viewGrades = viewSem ? semesterCourseGrades[viewSem.semester] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Semester Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cumulative CGPA {studentProfile.cgpa} · {totalCredits} credits earned.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          downloadMockPdf("semester-marksheet", [
            "Semester Results Summary",
            `Overall CGPA: ${studentProfile.cgpa}`,
            "",
            ...semesterResults.map((s) => `Semester ${s.semester}: GPA ${s.gpa} · ${s.credits} credits · ${s.status}`),
          ]);
          toast.success("Result PDF downloaded");
        }}>
          <Download className="size-4" /> Download Result
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AttributeCard icon={GraduationCap} label="Current CGPA" value={studentProfile.cgpa} tone="primary" />
        <AttributeCard icon={Award} label="Best GPA" value={best} tone="success" />
        <AttributeCard icon={TrendingUp} label="Semesters" value={semesterResults.length} tone="info" />
        <AttributeCard icon={GraduationCap} label="Total Credits" value={totalCredits} tone="mist" />
      </div>

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

        <ChartCard title="Credits per Semester" icon={GraduationCap}>
          <BarChart data={semesterResults.map((s) => ({ name: `Sem ${s.semester}`, credits: s.credits }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-accent)", opacity: 0.3 }} />
            <Bar dataKey="credits" fill={CHART.c3} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <SectionCard title="Result Summary" icon={Award} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Semester</th>
                <th className="px-5 py-3 font-medium">GPA</th>
                <th className="px-5 py-3 font-medium">Credits</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {semesterResults.map((s) => (
                <tr key={s.semester} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3 font-medium text-foreground">Semester {s.semester}</td>
                  <td className="px-5 py-3">
                    <span className="font-display text-base font-bold text-foreground">{s.gpa}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{s.credits}</td>
                  <td className="px-5 py-3"><Pill tone={statusTone(s.status)} dot>{s.status}</Pill></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={s.status !== "Published"}
                        onClick={() => setViewSem(s)}
                      >
                        <Eye className="size-4" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={s.status !== "Published"}
                        onClick={() => {
                          downloadMockPdf(`semester-${s.semester}-marksheet`, [
                            `Semester ${s.semester} Marksheet`,
                            `GPA: ${s.gpa}  Credits: ${s.credits}  Status: ${s.status}`,
                            "",
                            ...(semesterCourseGrades[s.semester] ?? []).map((g) => `${g.code} - ${g.name}: Grade ${g.grade} (${g.gradePoint} pts, ${g.credits} cr)`),
                          ]);
                          toast.success(`Semester ${s.semester} marksheet downloaded`);
                        }}
                      >
                        <Download className="size-4" /> PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* View result modal */}
      <FloatingModal
        open={!!viewSem}
        onClose={() => setViewSem(null)}
        title={viewSem ? `Semester ${viewSem.semester} Result` : ""}
        description={viewSem ? `${viewSem.credits} credits · ${viewSem.status}` : ""}
      >
        {viewSem && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-accent/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Course</th>
                    <th className="px-3 py-2 font-medium">Credits</th>
                    <th className="px-3 py-2 font-medium">Grade</th>
                    <th className="px-3 py-2 font-medium">Grade Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {viewGrades.map((g) => (
                    <tr key={g.code}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.code}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{g.credits}</td>
                      <td className="px-3 py-2"><Pill tone="primary" dot>{g.grade}</Pill></td>
                      <td className="px-3 py-2 text-muted-foreground">{g.gradePoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Semester GPA</p>
                <p className="font-display text-lg font-bold text-foreground">{viewSem.gpa}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Overall CGPA</p>
                <p className="font-display text-lg font-bold text-foreground">{studentProfile.cgpa}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewSem(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
