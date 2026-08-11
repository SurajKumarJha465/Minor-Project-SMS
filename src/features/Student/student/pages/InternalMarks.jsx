import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, ListChecks } from "lucide-react";

import SectionCard from "@/features/Student/ui/SectionCard";
import ProgressBar from "@/features/Student/ui/ProgressBar";
import Pill, { statusTone } from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { downloadFile } from "@/lib/utils";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

// Mirrors the exact components + max marks the HOD enters and publishes
// (see hod.internal-results.tsx) — Practical totals 20, Theory totals 30.
const PRACTICAL_FIELDS = [
  { key: "p_att", label: "Attendance & Participation", max: 2 },
  { key: "p_lab", label: "Lab / Project Report", max: 4 },
  { key: "p_exam", label: "Practical Exam / Project Work", max: 8 },
  { key: "p_viva", label: "Viva", max: 6 },
];
const THEORY_FIELDS = [
  { key: "t_att", label: "Attendance & Participation", max: 3 },
  { key: "t_assign", label: "Assignment", max: 6 },
  { key: "t_present", label: "Presentation", max: 3 },
  { key: "t_assess", label: "Internal Assessment", max: 18 },
];
const PRACTICAL_MAX = PRACTICAL_FIELDS.reduce((a, f) => a + f.max, 0); // 20
const THEORY_MAX = THEORY_FIELDS.reduce((a, f) => a + f.max, 0); // 30

function sumFields(row, fields) {
  return fields.reduce((a, f) => a + (row[f.key] || 0), 0);
}

function remarkFor(total) {
  if (total >= 45) return { label: "Outstanding", tone: "success" };
  if (total >= 40) return { label: "Very Good", tone: "primary" };
  if (total >= 30) return { label: "Good", tone: "info" };
  return { label: "Needs Improvement", tone: "warning" };
}

export default function InternalMarks() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/student/internal-marks`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load internal marks (${res.status})`);
        const data = await res.json();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load internal marks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const published = rows.filter((r) => r.status === "published");
  const avg = published.length ? Math.round(published.reduce((a, c) => a + c.total, 0) / published.length) : 0;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(`${API_URL}/api/student/internal-marks/report`, { ...authHeader() }, "internal-marks.pdf");
      toast.success("Marks sheet downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the marks sheet.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Internal Marks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : published.length
                ? `Average internal score ${avg}/50 across ${published.length} published course${published.length === 1 ? "" : "s"}${
                    rows.length > published.length ? ` · ${rows.length - published.length} pending` : ""
                  }.`
                : "No published internal marks yet."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!published.length || downloading}
          onClick={handleDownload}
        >
          <Download className="size-4" /> {downloading ? "Downloading…" : "Download Marks"}
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && !loading && rows.length === 0 && (
        <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
          You aren't enrolled in any courses yet.
        </p>
      )}

      {/* Components legend */}
      <SectionCard title="Marks Components" icon={ListChecks}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practical · /{PRACTICAL_MAX}</p>
            <div className="grid grid-cols-2 gap-2">
              {PRACTICAL_FIELDS.map((f) => (
                <div key={f.key} className="rounded-xl border border-border/60 bg-card p-3 text-center">
                  <p className="font-display text-base font-bold text-foreground">/{f.max}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theory · /{THEORY_MAX}</p>
            <div className="grid grid-cols-2 gap-2">
              {THEORY_FIELDS.map((f) => (
                <div key={f.key} className="rounded-xl border border-border/60 bg-card p-3 text-center">
                  <p className="font-display text-base font-bold text-foreground">/{f.max}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {!!rows.length && (
        <SectionCard title="Course Internal Assessment" icon={ListChecks} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Practical /{PRACTICAL_MAX}</th>
                  <th className="px-5 py-3 font-medium">Theory /{THEORY_MAX}</th>
                  <th className="px-5 py-3 font-medium">Total /50</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((c) => {
                  const isPublished = c.status === "published";
                  const remark = isPublished ? remarkFor(c.total) : null;
                  return (
                    <tr key={c.course_id} className="transition-colors hover:bg-accent/40">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.code}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {isPublished ? sumFields(c, PRACTICAL_FIELDS) : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {isPublished ? sumFields(c, THEORY_FIELDS) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {isPublished ? (
                          <div className="flex items-center gap-2">
                            <ProgressBar value={(c.total / c.max) * 100} showValue={false} size="sm" className="w-20" tone={c.total >= 45 ? "success" : "primary"} />
                            <span className="text-xs font-semibold text-foreground">{c.total}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isPublished ? (
                          <Pill tone={remark.tone} dot>{remark.label}</Pill>
                        ) : (
                          <Pill tone={statusTone("Pending")} dot>Pending</Pill>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewRow(c)} disabled={!isPublished} title={isPublished ? undefined : "Not published yet"}>
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* View details modal */}
      <FloatingModal
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.name}
        description={viewRow?.code}
      >
        {viewRow && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practical · {sumFields(viewRow, PRACTICAL_FIELDS)}/{PRACTICAL_MAX}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {PRACTICAL_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="font-semibold text-foreground">{viewRow[f.key]} / {f.max}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theory · {sumFields(viewRow, THEORY_FIELDS)}/{THEORY_MAX}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {THEORY_FIELDS.map((f) => (
                  <div key={f.key} className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="font-semibold text-foreground">{viewRow[f.key]} / {f.max}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Total Internal Marks</p>
              <p className="font-display text-lg font-bold text-foreground">{viewRow.total} / {viewRow.max}</p>
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