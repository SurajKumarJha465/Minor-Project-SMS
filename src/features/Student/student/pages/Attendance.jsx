import { toast } from "sonner";
import { CalendarCheck, CalendarDays, CircleUserRound, Clock, Download, LogOut, UserCheck, UserX } from "lucide-react";

import AttributeCard from "@/components/ui/AttributeCard";
import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Pill, { statusTone } from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import { downloadMockPdf } from "@/lib/utils";
import { attendanceCalendar, attendanceSummary, courseWiseAttendance } from "@/data/mock/student";

const STATUS_STYLE = {
  present: "bg-success/15 text-success",
  absent: "bg-destructive/12 text-destructive",
  late: "bg-warning/25 text-warning-foreground",
  leave: "bg-info/20 text-info-foreground",
  weekend: "bg-muted text-muted-foreground/50",
};
const LEGEND = [
  { label: "Present", key: "present", tone: "success" },
  { label: "Absent", key: "absent", tone: "danger" },
  { label: "Late", key: "late", tone: "warning" },
  { label: "Leave", key: "leave", tone: "info" },
];
const attStatusTone = (s) => (s === "Excellent" ? "success" : s === "Good" ? "info" : "warning");

export default function Attendance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overall attendance {attendanceSummary.overall}% across {attendanceSummary.totalClasses} classes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          downloadMockPdf("attendance-report", [
            "Attendance Report",
            `Overall: ${attendanceSummary.overall}%  |  Total Classes: ${attendanceSummary.totalClasses}`,
            `Present: ${attendanceSummary.present}  Absent: ${attendanceSummary.absent}  Late: ${attendanceSummary.late}  Leave: ${attendanceSummary.leave}`,
            "",
            "Course-wise Attendance:",
            ...courseWiseAttendance.map((c) => `${c.code} - ${c.name}: ${c.percentage}% (${c.status})`),
          ]);
          toast.success("Attendance report downloaded");
        }}>
          <Download className="size-4" /> Download Report
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <AttributeCard icon={CalendarCheck} label="Overall" value={`${attendanceSummary.overall}%`} tone="primary" />
        <AttributeCard icon={UserCheck} label="Present" value={attendanceSummary.present} tone="success" />
        <AttributeCard icon={UserX} label="Absent" value={attendanceSummary.absent} tone="mist" />
        <AttributeCard icon={Clock} label="Late" value={attendanceSummary.late} tone="warning" />
        <AttributeCard icon={LogOut} label="Leave" value={attendanceSummary.leave} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Calendar */}
        <SectionCard title="Monthly Calendar" subtitle="Colour-coded daily attendance" icon={CalendarDays} className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap gap-3">
            {LEGEND.map((l) => (
              <span key={l.key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-3 rounded-full ${STATUS_STYLE[l.key]}`} /> {l.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="py-1">{d}</span>
            ))}
            {attendanceCalendar.map((d) => (
              <div
                key={d.day}
                title={d.status}
                className={`grid aspect-square place-items-center rounded-lg text-xs font-semibold ${STATUS_STYLE[d.status]}`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Course-wise progress */}
        <SectionCard title="Course-wise %" icon={CircleUserRound} className="lg:col-span-2">
          <div className="space-y-4">
            {courseWiseAttendance.map((c) => (
              <div key={c.code}>
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
              {courseWiseAttendance.map((c) => (
                <tr key={c.code} className="transition-colors hover:bg-accent/40">
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
