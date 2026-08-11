import { useEffect, useMemo, useState } from "react";
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

import AttributeCard from "@/features/Student/ui/AttributeCard";
import ChartCard from "@/features/Student/ui/ChartCard";
import SectionCard from "@/features/Student/ui/SectionCard";
import Pill, { statusTone } from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { CHART, tooltipStyle } from "@/features/Student/lib/chart-colors";
import { downloadFile } from "@/lib/utils";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export default function SemesterResults() {
  const [data, setData] = useState(null); // { cgpa, results, courses_by_semester }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewSem, setViewSem] = useState(null);
  const [downloadingSem, setDownloadingSem] = useState(null); // null | "all" | semester number

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/results`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load results (${res.status})`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const results = data?.results ?? [];
  const coursesBySemester = data?.courses_by_semester ?? {};
  const cgpa = data?.cgpa ?? 0;

  const totalCredits = useMemo(() => results.reduce((a, s) => a + s.credits, 0), [results]);
  const best = useMemo(() => (results.length ? Math.max(...results.map((s) => s.gpa)) : 0), [results]);
  const viewGrades = viewSem ? coursesBySemester[viewSem.semester] ?? [] : [];

  const handleDownload = async (semester) => {
    setDownloadingSem(semester ?? "all");
    try {
      const url = semester
        ? `${API_URL}/api/student/results/report?semester=${semester}`
        : `${API_URL}/api/student/results/report`;
      const fallback = semester ? `semester-${semester}-marksheet.pdf` : "semester-results.pdf";
      await downloadFile(url, { ...authHeader() }, fallback);
      toast.success(semester ? `Semester ${semester} marksheet downloaded` : "Result PDF downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the result.");
    } finally {
      setDownloadingSem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Semester Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `Cumulative CGPA ${cgpa} · ${totalCredits} credits earned.`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!results.length || downloadingSem !== null}
          onClick={() => handleDownload()}
        >
          <Download className="size-4" /> {downloadingSem === "all" ? "Downloading…" : "Download Result"}
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && !loading && results.length === 0 && (
        <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          No results have been recorded yet. Check back once your teachers publish final grades.
        </p>
      )}

      {!error && results.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AttributeCard icon={GraduationCap} label="Current CGPA" value={cgpa} tone="primary" />
            <AttributeCard icon={Award} label="Best GPA" value={best} tone="success" />
            <AttributeCard icon={TrendingUp} label="Semesters" value={results.length} tone="info" />
            <AttributeCard icon={GraduationCap} label="Total Credits" value={totalCredits} tone="mist" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Semester GPA Trend" icon={TrendingUp}>
              <LineChart
                data={results.map((s) => ({ name: `Sem ${s.semester}`, gpa: s.gpa }))}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 4]} stroke={CHART.axis} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="gpa" stroke={CHART.c1} strokeWidth={2.5} dot={{ r: 4, fill: CHART.c1 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="Credits per Semester" icon={GraduationCap}>
              <BarChart data={results.map((s) => ({ name: `Sem ${s.semester}`, credits: s.credits }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
                  {results.map((s) => (
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
                            disabled={s.status !== "Published" || downloadingSem !== null}
                            onClick={() => handleDownload(s.semester)}
                          >
                            <Download className="size-4" /> {downloadingSem === s.semester ? "…" : "PDF"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

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
                      <td className="px-3 py-2 text-muted-foreground">{g.grade_point}</td>
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
                <p className="font-display text-lg font-bold text-foreground">{cgpa}</p>
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