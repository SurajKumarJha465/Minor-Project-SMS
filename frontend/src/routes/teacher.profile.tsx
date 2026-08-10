// --- teacher.profile.tsx ---

// 1. Update the import:
import {
  getTeacherCourses, groupTeacherCourses, sectionLabel,
  type TeacherCourse, type TeacherMeDto,
} from "@/features/Teacher/lib/academic-data";

// 2. Replace the "Assigned Courses" CardContent block:

//   BEFORE:
//
//   <CardContent className="space-y-2.5">
//     {courses.length === 0 ? (
//       <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
//     ) : (
//       courses.map((c) => (
//         <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
//           <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary font-mono text-xs font-bold">
//             {c.code.split("-")[1] ?? c.code}
//           </div>
//           <div className="min-w-0">
//             <div className="truncate text-sm font-semibold">{c.name}</div>
//             <div className="text-xs text-muted-foreground">{c.code} · Sem {c.sem} · Sec {sectionLabel(c.section ?? "d")}</div>
//           </div>
//         </div>
//       ))
//     )}
//   </CardContent>

//   AFTER:

<CardContent className="space-y-2.5">
  {courses.length === 0 ? (
    <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
  ) : (
    groupTeacherCourses(courses).map((g) => (
      <div key={g.code} className="flex items-start gap-3 rounded-xl border border-border p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary font-mono text-xs font-bold">
          {g.code.split("-")[1] ?? g.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{g.name}</div>
          <div className="text-xs text-muted-foreground">{g.code}</div>

          {/* one badge per (sem, section) offering — differentiates M1 vs M2 vs D
              even when they're the same course code taught across semesters */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {g.offerings.map((o) => (
              <span
                key={o.id}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                Sem {o.sem} · Sec {sectionLabel(o.section)}
              </span>
            ))}
          </div>
        </div>
      </div>
    ))
  )}
</CardContent>