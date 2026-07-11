import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, Filter, Paperclip, Search } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import FloatingModal from "@/components/ui/FloatingModal";
import { noticeCategories, notices } from "@/data/mock/student";

const CAT_TONE = { Important: "danger", Academic: "info", Department: "primary", Exam: "warning" };

export default function NoticeBoard() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [viewNotice, setViewNotice] = useState(null);

  const filtered = useMemo(
    () =>
      notices.filter((n) => {
        const matchCat = category === "All" || n.category === category;
        const matchQuery = n.title.toLowerCase().includes(query.toLowerCase());
        return matchCat && matchQuery;
      }),
    [query, category],
  );

  const unread = notices.filter((n) => n.unread).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Notice Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unread} unread of {notices.length} notices.</p>
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
          {noticeCategories.map((c) => (
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
        {filtered.length === 0 && (
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
                {n.unread && <span className="size-2 rounded-full bg-destructive" title="Unread" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{n.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone={CAT_TONE[n.category]} dot>{n.category}</Pill>
                <span className="text-xs text-muted-foreground">{n.date}</span>
                {n.attachment && (
                  <button
                    onClick={() => toast.success(`Downloading ${n.attachment}`)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Paperclip className="size-3.5" /> {n.attachment}
                  </button>
                )}
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
        description={viewNotice?.date}
      >
        {viewNotice && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">{viewNotice.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={CAT_TONE[viewNotice.category]} dot>{viewNotice.category}</Pill>
              <Pill tone={viewNotice.priority === "High" ? "danger" : "neutral"}>{viewNotice.priority} priority</Pill>
            </div>
            {viewNotice.attachment && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-accent/30 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-foreground"><Paperclip className="size-4" /> {viewNotice.attachment}</span>
                <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloading ${viewNotice.attachment}`)}>Download</Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
