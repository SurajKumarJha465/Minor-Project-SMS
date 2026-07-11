import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Search, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { enrollmentRequests } from "@/lib/hod-mock-data";

export const Route = createFileRoute("/hod/enrollments")({
  head: () => ({ meta: [{ title: "Enrollment Approval · HOD" }] }),
  component: Enrollments,
});

function Enrollments() {
  const [q, setQ] = useState("");
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected" | "pending">>({});
  const rows = enrollmentRequests.filter((r) => (r.student + r.enrollment).toLowerCase().includes(q.toLowerCase()));

  const setStatus = (id: string, v: "approved" | "rejected") =>
    setDecisions((d) => ({ ...d, [id]: v }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Enrollment Approval</h1>
          <p className="text-sm text-muted-foreground">Review and approve pending student course enrollments.</p>
        </div>
        <Button className="rounded-xl gradient-brand text-white"><CheckCheck className="mr-1.5 h-4 w-4" /> Bulk Approve All</Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Pending Requests ({rows.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 rounded-xl bg-background/70 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r) => {
            const status = decisions[r.id] ?? r.status;
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                <Avatar className="h-11 w-11"><AvatarImage src={r.photo} /><AvatarFallback>{r.student[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{r.student}</div>
                    <Badge variant="secondary" className="rounded-lg font-mono text-[10px]">{r.enrollment}</Badge>
                    <Badge variant="outline" className="rounded-lg">Sem {r.semester}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.courses.map((c) => (
                      <span key={c} className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground">{c}</span>
                    ))}
                  </div>
                </div>
                {status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-9 rounded-lg text-destructive" onClick={() => setStatus(r.id, "rejected")}>
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button size="sm" className="h-9 rounded-lg gradient-brand text-white" onClick={() => setStatus(r.id, "approved")}>
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  </div>
                )}
                {status === "approved" && <Badge className="rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><Check className="mr-1 h-3 w-3" /> Approved</Badge>}
                {status === "rejected" && <Badge className="rounded-lg bg-destructive/15 text-destructive"><X className="mr-1 h-3 w-3" /> Rejected</Badge>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
