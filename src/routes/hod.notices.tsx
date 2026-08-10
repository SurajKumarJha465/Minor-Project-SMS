import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authHeader } from "@/lib/auth";
import { Megaphone, Pin, Paperclip, Send, CalendarClock, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/hod/notices")({
  head: () => ({ meta: [{ title: "Department Notices · HOD" }] }),
  component: Notices,
});

const API_URL = (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

const typeColor: Record<string, string> = {
  Exam: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Department: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Semester: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  Emergency: "bg-destructive/15 text-destructive",
};

type Notice = {
  id: number;
  title: string;
  body: string;
  type: string;
  audience: string;
  pinned: boolean;
  author: string;
  date: string;
  scheduled_for: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
};

function isFutureScheduled(n: Notice): boolean {
  if (!n.scheduled_for) return false;
  return new Date(n.scheduled_for).getTime() > Date.now();
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt";
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("Department");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All Semesters");
  const [pinned, setPinned] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(""); // datetime-local value
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [attachment, setAttachment] = useState<{ url: string; name: string; size: number } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File) {
    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast.error("File is larger than the 10 MB limit.");
      return;
    }
    setUploadingAttachment(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/hod/notices/attachment`, {
        method: "POST", headers: { ...authHeader() }, body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ?? "Failed to upload attachment");
      setAttachment({ url: data.attachment_url, name: data.attachment_name, size: data.attachment_size });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function loadNotices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/hod/notices`, { headers: { ...authHeader() } });
      if (!res.ok) throw new Error(`Failed to load notices (${res.status})`);
      setNotices(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadNotices(); }, []);

  function resetForm() {
    setType("Department");
    setTitle("");
    setBody("");
    setAudience("All Semesters");
    setPinned(false);
    setScheduleOpen(false);
    setScheduledFor("");
    setAttachment(null);
  }

  async function publish() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/hod/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          title, body, type, audience, pinned,
          scheduled_for: scheduleOpen && scheduledFor ? new Date(scheduledFor).toISOString() : null,
          attachment_url: attachment?.url ?? null,
          attachment_name: attachment?.name ?? null,
          attachment_size: attachment?.size ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "Failed to publish notice");
        return;
      }
      const created: Notice = await res.json();
      setNotices((prev) => [created, ...prev]);
      toast.success(isFutureScheduled(created) ? "Notice scheduled." : "Notice published.");
      resetForm();
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePin(n: Notice) {
    setBusyId(n.id);
    try {
      const res = await fetch(`${API_URL}/api/hod/notices/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ pinned: !n.pinned }),
      });
      if (!res.ok) {
        toast.error("Failed to update notice");
        return;
      }
      const updated: Notice = await res.json();
      setNotices((prev) => prev.map((x) => (x.id === n.id ? updated : x)).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(n: Notice) {
    setBusyId(n.id);
    try {
      const res = await fetch(`${API_URL}/api/hod/notices/${n.id}`, {
        method: "DELETE", headers: { ...authHeader() },
      });
      if (!res.ok) {
        toast.error("Failed to delete notice");
        return;
      }
      setNotices((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      toast.error("Could not reach the server. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Department Notice Board</h1>
        <p className="text-sm text-muted-foreground">Publish and manage department announcements.</p>
        </div>

        {error && !loading && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="pb-3"><CardTitle className="text-base">Create Notice</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Notice Type</label>
                <div className="flex flex-wrap gap-2">
                  {["Department", "Semester", "Exam", "Emergency"].map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Audience</label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. All Semesters, Sem 5 – 8" className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Message</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Write your notice here…" className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                <span className="text-sm font-medium">Pin to top</span>
                <Switch checked={pinned} onCheckedChange={setPinned} />
              </div>

              {scheduleOpen && (
                <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">Publish at</label>
                    <button onClick={() => { setScheduleOpen(false); setScheduledFor(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {attachment && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">{attachment.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ATTACHMENT_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline" className="rounded-xl"
                  disabled={uploadingAttachment}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="mr-1.5 h-4 w-4" />
                  {uploadingAttachment ? "Uploading…" : attachment ? "Replace attachment" : "Attach"}
                </Button>
                <Button
                  variant="outline" className="rounded-xl"
                  onClick={() => setScheduleOpen((v) => !v)}
                >
                  <CalendarClock className="mr-1.5 h-4 w-4" /> {scheduleOpen ? "Cancel schedule" : "Schedule"}
                </Button>
                <Button className="ml-auto rounded-xl gradient-brand text-white" disabled={submitting} onClick={publish}>
                  <Send className="mr-1.5 h-4 w-4" /> {scheduleOpen && scheduledFor ? "Schedule" : "Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Notice History</CardTitle>
              <span className="text-xs text-muted-foreground">{notices.length} total</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading && <div className="px-1 py-6 text-center text-sm text-muted-foreground">Loading notices…</div>}
              {!loading && notices.length === 0 && (
                <div className="px-1 py-6 text-center text-sm text-muted-foreground">No notices yet.</div>
              )}
              {!loading && notices.map((n) => {
                const scheduled = isFutureScheduled(n);
                return (
                  <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:shadow-soft">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-brand text-white">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold">{n.title}</div>
                        {n.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                        <Badge className={`rounded-lg ${typeColor[n.type] ?? ""}`}>{n.type}</Badge>
                        {scheduled && (
                          <Badge variant="outline" className="rounded-lg text-amber-700 dark:text-amber-300">
                            Scheduled · {n.scheduled_for}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{n.audience} · {n.author} · {n.date}</div>
                      {n.attachment_url && (
                        <a
                          href={`${API_URL}${n.attachment_url}`}
                          target="_blank" rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-primary hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          {n.attachment_name}
                          {n.attachment_size != null && <span className="text-muted-foreground">({formatBytes(n.attachment_size)})</span>}
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm" variant="ghost" className="h-8 rounded-lg px-2"
                        disabled={busyId === n.id} onClick={() => togglePin(n)}
                        title={n.pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className={`h-4 w-4 ${n.pinned ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-destructive hover:text-destructive"
                        disabled={busyId === n.id} onClick={() => remove(n)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}