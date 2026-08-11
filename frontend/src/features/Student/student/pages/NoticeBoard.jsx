import { useEffect, useMemo, useState } from "react";
import { Bell, Filter, Paperclip, Search } from "lucide-react";

import Pill from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { apiJson } from "@/lib/api";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const NOTICE_CATEGORIES = ["All", "Department", "Semester", "Exam", "Emergency"];
const CAT_TONE = { Department: "primary", Semester: "info", Exam: "warning", Emergency: "danger" };

// Same convention as teacher/HOD notices: the backend returns a relative
// /uploads/notices/<file> path that needs the API origin prefixed. The
// static mount that serves it back out has no auth check, so a plain link
// (no Authorization header needed) is enough to open/download it.
function attachmentSrc(url) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [viewNotice, setViewNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiJson("/api/student/notices");
        if (!cancelled) setNotices(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load notices.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () =>
      notices.filter((n) => {
        const matchCat = category === "All" || n.type === category;
        const matchQuery = n.title.toLowerCase().includes(query.toLowerCase());
        return matchCat && matchQuery;
      }),
    [notices, query, category],
  );

  const pinnedCount = notices.filter((n) => n.pinned).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Notice Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${pinnedCount} pinned of ${notices.length} notices.`}
          </p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notices…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="size-4 shrink-0 text-muted-foreground" />
          {NOTICE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                category === c ? "gradient-primary text-primary-foreground shadow-glow" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Notices */}
      <div className="space-y-3">
        {error && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && !loading && filtered.length === 0 && (
          <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">No notices found.</p>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className="flex gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl gradient-mist text-primary">
              <Bell className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-semibold text-foreground">{n.title}</h3>
                {n.pinned && <span className="size-2 rounded-full bg-destructive" title="Pinned" />}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
              {n.attachment_url && (
                <a
                  href={attachmentSrc(n.attachment_url)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-primary hover:underline"
                >
                  <Paperclip className="size-3" />
                  {n.attachment_name}
                  {n.attachment_size != null && (
                    <span className="text-muted-foreground">({formatBytes(n.attachment_size)})</span>
                  )}
                </a>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone={CAT_TONE[n.type] ?? "neutral"} dot>{n.type}</Pill>
                <span className="text-xs text-muted-foreground">{n.audience} · {n.author} · {n.date}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewNotice(n)}>
                  View
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View notice modal */}
      <FloatingModal
        open={!!viewNotice}
        onClose={() => setViewNotice(null)}
        title={viewNotice?.title}
        description={viewNotice ? `${viewNotice.audience} · ${viewNotice.author} · ${viewNotice.date}` : undefined}
      >
        {viewNotice && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm text-foreground">{viewNotice.body}</p>
            {viewNotice.attachment_url && (
              <a
                href={attachmentSrc(viewNotice.attachment_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-primary hover:underline"
              >
                <Paperclip className="size-3.5" />
                {viewNotice.attachment_name}
                {viewNotice.attachment_size != null && (
                  <span className="text-muted-foreground">({formatBytes(viewNotice.attachment_size)})</span>
                )}
              </a>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={CAT_TONE[viewNotice.type] ?? "neutral"} dot>{viewNotice.type}</Pill>
              {(viewNotice.pinned || viewNotice.type === "Emergency") && <Pill tone="danger">High priority</Pill>}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}