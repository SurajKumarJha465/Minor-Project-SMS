import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Users2, ChevronRight, ArrowLeft } from "lucide-react";
import { departments, semesters, sections, deptName, sectionLabel } from "@/lib/academic-data";
import { cn } from "@/lib/utils";

export type DrillState = { dept?: string; sem?: number; section?: string };

export function DrillBreadcrumb({ state, onNavigate }: { state: DrillState; onNavigate: (s: DrillState) => void }) {
  if (!state.dept) return null;
  const crumbs = [
    { label: "Departments", onClick: () => onNavigate({}) },
    state.dept && { label: deptName(state.dept), onClick: () => onNavigate({ dept: state.dept }) },
    state.sem && { label: `Semester ${state.sem}`, onClick: () => onNavigate({ dept: state.dept, sem: state.sem }) },
    state.section && { label: `Section ${sectionLabel(state.section)}`, onClick: () => onNavigate(state) },
  ].filter(Boolean) as { label: string; onClick: () => void }[];

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <Button
        variant="outline"
        size="sm"
        className="mr-1 rounded-lg"
        onClick={() => {
          if (state.section) onNavigate({ dept: state.dept, sem: state.sem });
          else if (state.sem) onNavigate({ dept: state.dept });
          else onNavigate({});
        }}
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
      </Button>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <button
            onClick={c.onClick}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition",
              i === crumbs.length - 1 ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {c.label}
          </button>
        </span>
      ))}
    </div>
  );
}

export function DepartmentPicker({ onSelect }: { onSelect: (deptId: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {departments.map((d) => (
        <Card
          key={d.id}
          onClick={() => onSelect(d.id)}
          className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
        >
          <div className="gradient-brand relative flex h-28 items-center justify-between p-5 text-white">
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-80">Department</div>
              <div className="mt-1 font-display text-lg font-bold leading-tight">{d.name}</div>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
              Open <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SemesterPicker({ onSelect }: { onSelect: (sem: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {semesters.map((s) => (
        <Card
          key={s}
          onClick={() => onSelect(s)}
          className="group cursor-pointer rounded-2xl border-border/60 p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl gradient-brand text-white shadow-soft">
            <Layers className="h-5 w-5" />
          </div>
          <div className="mt-3 font-display text-lg font-bold">Semester {s}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Tap to open sections</div>
        </Card>
      ))}
    </div>
  );
}

export function SectionPicker({ onSelect }: { onSelect: (sectionId: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {sections.map((s) => (
        <Card
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="group cursor-pointer rounded-2xl border-border/60 p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-glass"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl gradient-brand text-white shadow-soft">
            <Users2 className="h-5 w-5" />
          </div>
          <div className="mt-3 font-display text-lg font-bold">Section {s.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Tap to view courses</div>
        </Card>
      ))}
    </div>
  );
}
