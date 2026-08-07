import { useEffect, useMemo, useState } from "react";
import { Bell, Filter, Search } from "lucide-react";

import Pill from "@/features/Student/ui/Pill";
import Button from "@/features/Student/ui/Button";
import FloatingModal from "@/features/Student/ui/FloatingModal";
import { authHeader } from "@/lib/auth";

const API_URL = import.meta.env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const NOTICE_CATEGORIES = ["All", "Department", "Semester", "Exam", "Emergency"];
const CAT_TONE = { Department: "primary", Semester: "info", Exam: "warning", Emergency: "danger" };

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
        const res = await fetch(`${API_URL}/api/student/notices`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load notices (${res.status})`);
        const data = await res.json();
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