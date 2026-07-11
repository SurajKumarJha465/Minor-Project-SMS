import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Download, Printer, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hod/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · HOD" }] }),
  component: Reports,
});

const reports = [
  { title: "Department Report", desc: "Full snapshot of the department metrics.", icon: FileBarChart },
  { title: "Teacher Performance Report", desc: "Faculty workload, attendance, ratings.", icon: FileBarChart },
  { title: "Student Performance Report", desc: "GPA, attendance and assessment analytics.", icon: FileBarChart },
  { title: "Attendance Report", desc: "Course, teacher and semester-wise attendance.", icon: FileBarChart },
  { title: "Course Report", desc: "Enrollment, completion and outcome per course.", icon: FileBarChart },
  { title: "Semester Report", desc: "Semester-wise GPA, courses and results.", icon: FileBarChart },
  { title: "Internal Marks Report", desc: "Unit-wise marks and distribution.", icon: FileBarChart },
  { title: "Result Analysis", desc: "Pass %, fail %, and top / at-risk students.", icon: FileBarChart },
];

function Reports() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Generate and export departmental reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reports.map((r) => (
          <Card key={r.title} className="group rounded-2xl shadow-soft transition hover:-translate-y-0.5 hover:shadow-glass">
            <CardHeader className="pb-2">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-soft">
                <r.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2 text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{r.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs"><FileText className="mr-1 h-3 w-3" /> PDF</Button>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs"><FileSpreadsheet className="mr-1 h-3 w-3" /> Excel</Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs"><Printer className="mr-1 h-3 w-3" /> Print</Button>
                <Button size="sm" className="h-8 rounded-lg text-xs gradient-brand text-white ml-auto"><Download className="mr-1 h-3 w-3" /> Generate</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
