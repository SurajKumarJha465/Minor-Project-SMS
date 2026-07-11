import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, FileText, MessageSquare, Upload, UserRound } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import FloatingModal from "@/components/ui/FloatingModal";
import { pendingAssignments, submittedAssignments } from "@/data/mock/student";

const PRIORITY_TONE = { High: "danger", Medium: "warning", Low: "info" };
const STATUS_TONE = { Pending: "warning", "In Progress": "primary" };

export default function Assignments() {
  const [uploadFor, setUploadFor] = useState(null);
  const [tab, setTab] = useState("pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingAssignments.length} pending · {submittedAssignments.length} submitted
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-border/60 bg-card p-1 shadow-soft">
        {[
          { id: "pending", label: `Pending (${pendingAssignments.length})` },
          { id: "submitted", label: `Submitted (${submittedAssignments.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendingAssignments.map((a) => (
            <div key={a.id} className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-xl gradient-mist text-primary">
                  <FileText className="size-5" />
                </span>
                <div className="flex flex-col items-end gap-1.5">
                  <Pill tone={PRIORITY_TONE[a.priority]} dot>{a.priority}</Pill>
                  <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
                </div>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-foreground">{a.title}</h3>
              <p className="text-xs text-muted-foreground">{a.course}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><UserRound className="size-3.5" /> {a.teacher}</p>
                <p className="flex items-center gap-1.5"><CalendarClock className="size-3.5" /> Due {a.due}</p>
              </div>
              <div className="mt-3">
                <ProgressBar value={a.progress} tone="primary" size="sm" label="Progress" />
              </div>
              <Button size="sm" className="mt-4" onClick={() => setUploadFor(a)}>
                <Upload className="size-4" /> Submit Assignment
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <SectionCard title="Submission History" icon={CheckCircle2} bodyClassName="p-0">
          <div className="divide-y divide-border/60">
            {submittedAssignments.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
                      <CheckCircle2 className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.course} · Submitted {a.submitted}</p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0" /> {a.feedback}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-accent/40 px-4 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Marks</p>
                  <p className="font-display text-lg font-bold text-foreground">{a.marks}<span className="text-sm text-muted-foreground">/{a.total}</span></p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Upload modal */}
      <FloatingModal
        open={!!uploadFor}
        onClose={() => setUploadFor(null)}
        title="Submit Assignment"
        description={uploadFor ? `${uploadFor.title} · ${uploadFor.course}` : ""}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setUploadFor(null);
            toast.success("Assignment submitted successfully");
          }}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-accent/30 p-8 text-center transition-colors hover:border-primary/50">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">Click to upload file</span>
            <span className="text-xs text-muted-foreground">PDF, DOCX or ZIP up to 25 MB</span>
            <input type="file" className="hidden" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setUploadFor(null)}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </FloatingModal>
    </div>
  );
}
