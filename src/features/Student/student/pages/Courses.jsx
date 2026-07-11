import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Download, FileText, FolderOpen, GraduationCap, Layers, UserRound } from "lucide-react";

import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Pill from "@/components/ui/Pill";
import Button from "@/components/ui/Button";
import FloatingModal from "@/components/ui/FloatingModal";
import { courses } from "@/data/mock/student";

const COLOR_TONE = { primary: "primary", info: "info", success: "success", warning: "warning" };
const RESOURCE_ICON = { PDF: FileText, Slides: Layers, Document: FolderOpen };

export default function Courses() {
  const [viewCourse, setViewCourse] = useState(null);
  const [resourceCourse, setResourceCourse] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">My Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {courses.length} courses enrolled this semester · {courses.reduce((a, c) => a + c.credits, 0)} total credits
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <div
            key={c.code}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-xl gradient-mist text-primary">
                <BookOpen className="size-5" />
              </span>
              <Pill tone={COLOR_TONE[c.color]} dot>{c.credits} credits</Pill>
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-foreground">{c.name}</h3>
            <p className="text-xs text-muted-foreground">{c.code}</p>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="size-3.5" /> {c.teacher}
            </div>

            <div className="mt-4 space-y-3">
              <ProgressBar value={c.attendance} tone="success" size="sm" label="Attendance" />
              <div className="flex items-center justify-between rounded-xl bg-accent/40 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="size-3.5" /> Internal Marks
                </span>
                <span className="font-semibold text-foreground">{c.internal}/50</span>
              </div>
              <ProgressBar value={c.progress} tone="primary" size="sm" label="Course Progress" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewCourse(c)}>
                View Details
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setResourceCourse(c)}>
                <FolderOpen className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* View course details */}
      <FloatingModal
        open={!!viewCourse}
        onClose={() => setViewCourse(null)}
        title={viewCourse?.name}
        description={viewCourse?.code}
      >
        {viewCourse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Course Code</p>
                <p className="font-semibold text-foreground">{viewCourse.code}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Credit Hours</p>
                <p className="font-semibold text-foreground">{viewCourse.credits}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs text-muted-foreground">Teacher</p>
                <p className="font-semibold text-foreground">{viewCourse.teacher}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Course Description</p>
              <p className="text-sm text-foreground">{viewCourse.description}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResourceCourse(viewCourse); setViewCourse(null); }}>
                <FolderOpen className="size-4" /> View Resources
              </Button>
              <Button variant="ghost" onClick={() => setViewCourse(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>

      {/* Course materials / resources */}
      <FloatingModal
        open={!!resourceCourse}
        onClose={() => setResourceCourse(null)}
        title={`${resourceCourse?.name ?? ""} Materials`}
        description="Course materials shared by your teacher."
      >
        {resourceCourse && (
          <div className="space-y-2">
            {resourceCourse.resources.map((r) => {
              const Icon = RESOURCE_ICON[r.type] ?? FileText;
              return (
                <div key={r.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.type}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloading ${r.name}`)}>
                    <Download className="size-4" />
                  </Button>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setResourceCourse(null)}>Close</Button>
            </div>
          </div>
        )}
      </FloatingModal>
    </div>
  );
}
