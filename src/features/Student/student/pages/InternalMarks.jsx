import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, ListChecks } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import FloatingModal from "@/components/ui/FloatingModal";
import { downloadMockPdf } from "@/lib/utils";
import { internalMarks } from "@/data/mock/student";

const WEIGHTAGE = [
  { label: "Unit Test", weight: "30%", tone: "primary" },
  { label: "Assessment", weight: "25%", tone: "info" },
  { label: "Assignment", weight: "25%", tone: "success" },
  { label: "Attendance", weight: "20%", tone: "warning" },
];
const remarkTone = (r) => (r === "Outstanding" ? "success" : r === "Very Good" ? "primary" : "info");

export default function InternalMarks() {
  const avg = Math.round(internalMarks.reduce((a, c) => a + c.total, 0) / internalMarks.length);
  const [viewRow, setViewRow] = useState(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Internal Marks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Average internal score {avg}/50 across {internalMarks.length} courses.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          downloadMockPdf("internal-marks", [
            "Internal Marks Report",
            `Average: ${avg}/50`,
            "",
            ...internalMarks.map((c) => `${c.code} - ${c.name}: ${c.total}/${c.max} (${c.remark})`),
          ]);
          toast.success("Marks sheet downloaded");
        }}>
          <Download className="size-4" /> Download Marks
        </Button>
      </div>

      {/* Weightage legend */}
      <SectionCard title="Marks Weightage" icon={ListChecks}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WEIGHTAGE.map((w) => (
            <div key={w.label} className="rounded-xl border border-border/60 bg-card p-4 text-center">
              <p className="font-display text-xl font-bold text-foreground">{w.weight}</p>
              <p className="text-xs text-muted-foreground">{w.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Course Internal Assessment" icon={ListChecks} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Unit Test</th>
                <th className="px-5 py-3 font-medium">Assessment</th>
                <th className="px-5 py-3 font-medium">Assignment</th>
                <th className="px-5 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Total /50</th>
                <th className="px-5 py-3 font-medium">Remark</th>
                <th className="px-5 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {internalMarks.map((c) => (
                <tr key={c.code} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.code}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.unit}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.assessment}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.assignment}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.attendance}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={(c.total / c.max) * 100} showValue={false} size="sm" className="w-20" tone={c.total >= 45 ? "success" : "primary"} />
                      <span className="text-xs font-semibold text-foreground">{c.total}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Pill tone={remarkTone(c.remark)} dot>{c.remark}</Pill></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setViewRow(c)}>
                      <Eye className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* View details modal */}
      <FloatingModal
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.name}
        description={viewRow?.code}
      >
        {viewRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Unit Test Marks</p>
                <p className="font-semibold text-foreground">{viewRow.unit} / 15</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Assessment Marks</p>
                <p className="font-semibold text-foreground">{viewRow.assessment} / 12.5</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Assignment Marks</p>
                <p className="font-semibold text-foreground">{viewRow.assignment} / 12.5</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Attendance Marks</p>
                <p className="font-semibold text-foreground">{viewRow.attendance} / 10</p>
              </div>
              <div className="col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Total Internal Marks</p>
                <p className="font-display text-lg font-bold text-foreground">{viewRow.total} / {viewRow.max}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Teacher Remarks</p>
              <p className="text-sm text-foreground">{viewRow.teacherRemark}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewRow(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
