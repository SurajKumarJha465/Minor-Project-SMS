import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileBarChart, Download, Printer, FileSpreadsheet, FileText, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { authHeader } from "@/lib/auth";

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export const Route = createFileRoute("/hod/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · HOD" }] }),
  component: Reports,
});

type ReportKind = "attendance" | "results";

type AttendanceReport = {
  overall_pct: number;
  total_records: number;
  by_course: { code: string; name: string; pct: number }[];
  by_teacher: { teacher_id: number; name: string; pct: number }[];
  low_attendance_students: { id: string; name: string; enrollment: string; semester: number; pct: number }[];
};

type ResultsReport = {
  avg_percentage: number;
  pass_percentage: number;
  fail_percentage: number;
  pass_fail_by_course: { code: string; passed: number; failed: number }[];
  top_students: { id: string; name: string; enrollment: string; semester: number; percentage: number }[];
  at_risk_students: { id: string; name: string; enrollment: string; semester: number; percentage: number }[];
};

const reports: { title: string; desc: string; icon: typeof FileBarChart; kind: ReportKind | null }[] = [
  { title: "Department Report", desc: "Full snapshot of the department metrics.", icon: FileBarChart, kind: null },
  { title: "Teacher Performance Report", desc: "Faculty workload, attendance, ratings.", icon: FileBarChart, kind: null },
  { title: "Student Performance Report", desc: "GPA, attendance and assessment analytics.", icon: FileBarChart, kind: null },
  { title: "Attendance Report", desc: "Course, teacher and semester-wise attendance.", icon: FileBarChart, kind: "attendance" },
  { title: "Course Report", desc: "Enrollment, completion and outcome per course.", icon: FileBarChart, kind: null },
  { title: "Semester Report", desc: "Semester-wise GPA, courses and results.", icon: FileBarChart, kind: null },
  { title: "Internal Marks Report", desc: "Unit-wise marks and distribution.", icon: FileBarChart, kind: null },
  { title: "Result Analysis", desc: "Pass %, fail %, and top / at-risk students.", icon: FileBarChart, kind: "results" },
];

/** Builds a CSV string from a header row + data rows and triggers a download. */
function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function attendanceCsvRows(data: AttendanceReport): { header: string[]; rows: (string | number)[][] } {
  const rows: (string | number)[][] = [
    ["Overall attendance %", data.overall_pct],
    ["Total attendance records", data.total_records],
    [],
    ["By Course"],
    ["Code", "Name", "Attendance %"],
    ...data.by_course.map((c) => [c.code, c.name, c.pct]),
    [],
    ["By Teacher"],
    ["Name", "Attendance %"],
    ...data.by_teacher.map((t) => [t.name, t.pct]),
    [],
    ["Low Attendance Students (< 75%)"],
    ["Name", "Enrollment", "Semester", "Attendance %"],
    ...data.low_attendance_students.map((s) => [s.name, s.enrollment, s.semester, s.pct]),
  ];
  return { header: ["Attendance Report"], rows };
}

function resultsCsvRows(data: ResultsReport): { header: string[]; rows: (string | number)[][] } {
  const rows: (string | number)[][] = [
    ["Average percentage", data.avg_percentage],
    ["Pass %", data.pass_percentage],
    ["Fail %", data.fail_percentage],
    [],
    ["Pass / Fail by Course"],
    ["Code", "Passed", "Failed"],
    ...data.pass_fail_by_course.map((c) => [c.code, c.passed, c.failed]),
    [],
    ["Top Students"],
    ["Name", "Enrollment", "Semester", "Percentage"],
    ...data.top_students.map((s) => [s.name, s.enrollment, s.semester, s.percentage]),
    [],
    ["At-Risk Students"],
    ["Name", "Enrollment", "Semester", "Percentage"],
    ...data.at_risk_students.map((s) => [s.name, s.enrollment, s.semester, s.percentage]),
  ];
  return { header: ["Result Analysis"], rows };
}

function Reports() {
  const [openKind, setOpenKind] = useState<ReportKind | null>(null);
  const [loadingKind, setLoadingKind] = useState<ReportKind | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [resultsData, setResultsData] = useState<ResultsReport | null>(null);

  async function generate(kind: ReportKind) {
    setLoadingKind(kind);
    try {
      const path = kind === "attendance" ? "/api/hod/reports/attendance" : "/api/hod/marks/results";
      const res = await fetch(`${API_URL}${path}`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
      const data = await res.json();
      if (kind === "attendance") setAttendanceData(data);
      else setResultsData(data);
      setOpenKind(kind);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate report.");
    } finally {
      setLoadingKind(null);
    }
  }

  function exportCsv(kind: ReportKind) {
    if (kind === "attendance" && attendanceData) {
      const { header, rows } = attendanceCsvRows(attendanceData);
      downloadCsv("attendance-report.csv", header, rows);
    } else if (kind === "results" && resultsData) {
      const { header, rows } = resultsCsvRows(resultsData);
      downloadCsv("result-analysis.csv", header, rows);
    }
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Generate and export departmental reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((r) => {
          const wired = r.kind !== null;
          const busy = loadingKind === r.kind;
          return (
            <Card key={r.title} className="group rounded-2xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
              <CardHeader className="pb-2">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                  <r.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{r.desc}</p>
                {!wired && (
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">Coming soon</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled={!wired}
                    onClick={() => wired && r.kind && exportCsv(r.kind)}
                  >
                    <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" disabled={!wired}>
                    <FileText className="mr-1 h-3 w-3" /> PDF
                  </Button>
                  <Button
                    size="sm" className="h-8 rounded-lg text-xs gradient-brand text-white ml-auto"
                    disabled={!wired || busy}
                    onClick={() => wired && r.kind && generate(r.kind)}
                  >
                    <Download className="mr-1 h-3 w-3" /> {busy ? "Loading…" : "Generate"}
                  </Button>
                </div>
                {wired && r.kind && (r.kind === "attendance" ? attendanceData : resultsData) && (
                  <Button
                    size="sm" variant="secondary" className="h-8 w-full rounded-lg text-xs"
                    onClick={() => r.kind && setOpenKind(r.kind)}
                  >
                    <Eye className="mr-1 h-3 w-3" /> View last generated report
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attendance Report viewer */}
      <Dialog open={openKind === "attendance"} onOpenChange={(o) => !o && setOpenKind(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          {attendanceData && (
            <div id="report-printable">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <DialogTitle>Attendance Report</DialogTitle>
                    <DialogDescription>Department-wide attendance, generated just now.</DialogDescription>
                  </div>
                  <div className="flex gap-1.5 no-print">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => exportCsv("attendance")}>
                      <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={printReport}>
                      <Printer className="mr-1 h-3 w-3" /> Print / PDF
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Overall Attendance" value={`${attendanceData.overall_pct}%`} />
                  <Stat label="Records Counted" value={attendanceData.total_records} />
                </div>

                <ReportTable
                  title="By Course"
                  head={["Code", "Name", "Attendance %"]}
                  rows={attendanceData.by_course.map((c) => [c.code, c.name, `${c.pct}%`])}
                  empty="No attendance recorded yet for any course."
                />

                <ReportTable
                  title="By Teacher"
                  head={["Name", "Attendance %"]}
                  rows={attendanceData.by_teacher.map((t) => [t.name, `${t.pct}%`])}
                  empty="No attendance recorded yet for any teacher."
                />

                <ReportTable
                  title="Low Attendance Students (< 75%)"
                  head={["Name", "Enrollment", "Semester", "Attendance %"]}
                  rows={attendanceData.low_attendance_students.map((s) => [s.name, s.enrollment, s.semester, `${s.pct}%`])}
                  empty="No students currently below 75% attendance."
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Analysis viewer */}
      <Dialog open={openKind === "results"} onOpenChange={(o) => !o && setOpenKind(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          {resultsData && (
            <div id="report-printable">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <DialogTitle>Result Analysis</DialogTitle>
                    <DialogDescription>Published internal marks, generated just now.</DialogDescription>
                  </div>
                  <div className="flex gap-1.5 no-print">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => exportCsv("results")}>
                      <FileSpreadsheet className="mr-1 h-3 w-3" /> Excel
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={printReport}>
                      <Printer className="mr-1 h-3 w-3" /> Print / PDF
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Average %" value={`${resultsData.avg_percentage}%`} />
                  <Stat label="Pass %" value={`${resultsData.pass_percentage}%`} />
                  <Stat label="Fail %" value={`${resultsData.fail_percentage}%`} />
                </div>

                <ReportTable
                  title="Pass / Fail by Course"
                  head={["Code", "Passed", "Failed"]}
                  rows={resultsData.pass_fail_by_course.map((c) => [c.code, c.passed, c.failed])}
                  empty="No published marks yet for any course."
                />

                <ReportTable
                  title="Top Students"
                  head={["Name", "Enrollment", "Semester", "Percentage"]}
                  rows={resultsData.top_students.map((s) => [s.name, s.enrollment, s.semester, `${s.percentage}%`])}
                  empty="No published marks yet."
                />

                <ReportTable
                  title="At-Risk Students"
                  head={["Name", "Enrollment", "Semester", "Percentage"]}
                  rows={resultsData.at_risk_students.map((s) => [s.name, s.enrollment, s.semester, `${s.percentage}%`])}
                  empty="No at-risk students right now."
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print-only styles: hides everything except the open report when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-printable, #report-printable * { visibility: visible; }
          #report-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function ReportTable({
  title, head, rows, empty,
}: {
  title: string; head: string[]; rows: (string | number)[][]; empty: string;
}) {
  return (
    <div>
      <div className="mb-2 font-display text-sm font-bold">{title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-border/60">
                  {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}