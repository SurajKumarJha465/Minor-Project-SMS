import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { authHeader } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Search, CalendarDays, Eye, Pin, Paperclip } from "lucide-react";

export const Route = createFileRoute("/teacher/notices")({
  head: () => ({ meta: [{ title: "Notice · Teacher Portal" }] }),
  component: NoticesPage,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

type Notice = {
  id: number;
  title: string;
  body: string;
  type: string;
  audience: string;
  pinned: boolean;
  author: string;
  date: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Notice | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/teacher/notices`, { headers: { ...authHeader() } });
        if (!res.ok) throw new Error(`Failed to load notices (${res.status})`);
        const data = await res.json();
        if (!cancelled) setNotices(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load notices.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.audience.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q),
    );
  }, [query, notices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Notice</h1>
        <p className="text-sm text-muted-foreground">View notices published by the college and department.</p>
      </div>

      {error && !loading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notice Board</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notices…"
              className="h-9 w-56 rounded-lg pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="py-6 text-center text-sm text-muted-foreground">Loading notices…</p>}
          {!loading && filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {notices.length === 0 ? "No notices yet." : "No notices match your search."}
            </p>
          )}
          {!loading && filtered.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-sm font-semibold">{n.title}</div>
                  {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  <Badge variant="secondary" className="rounded-full text-[10px]">{n.type}</Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.audience} · {n.date}</div>
                {n.attachment_url && (
                  <a
                    href={`${API_URL}${n.attachment_url}`}
                    target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    {n.attachment_name}
                    {n.attachment_size != null && <span className="text-muted-foreground">({formatBytes(n.attachment_size)})</span>}
                  </a>
                )}
              </div>
              <Button size="sm" variant="outline" className="shrink-0 rounded-lg" onClick={() => setActive(n)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">{active.type}</Badge>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">{active.audience}</Badge>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</div>
                  <p className="mt-1 text-sm leading-relaxed">{active.body}</p>
                </div>
                {active.attachment_url && (
                  <a
                    href={`${API_URL}${active.attachment_url}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {active.attachment_name}
                    {active.attachment_size != null && <span className="text-muted-foreground">({formatBytes(active.attachment_size)})</span>}
                  </a>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Published by {active.author} · {active.date}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}