# Why the preview won't update

## The breakage

The new commit's attendance page imports five things that don't exist in the file it imports them from.

`src/routes/teacher.attendance.$courseId.tsx` imports from `@/features/Teacher/lib/attendance-api`:

- `recognizeAttendanceFrame`
- `saveAttendance`
- `getTodayAttendance`
- type `AttendanceEntry`
- type `Status`

But `src/features/Teacher/lib/attendance-api.ts` in this workspace is a near-copy of `academic-data.ts` — it only exports course/roster/marks helpers (`getTeacherCourses`, `getCourseByCompositeId`, `getRosterForCourse`, `getCourseMarks`, `saveCourseMarks`, department/section constants). None of the five attendance exports are there.

Because those imports fail, the route module can't be evaluated, which is exactly the error the preview shows:

```text
TypeError: error loading dynamically imported module: .../@tanstack/react-router/dist/esm/index.dev.js
```

The router import is just the first thing in the failing module — the router itself is fine. Secondary type errors in the same file (`s` implicitly any, `student_id`/`similarity` implicitly any) are fallout from the missing types.

No other file in the project fails to typecheck. This one missing module is what's blocking the preview.

## Fix: add the missing attendance layer

Add the three attendance functions and two types to `src/features/Teacher/lib/attendance-api.ts`, built on the existing `src/lib/api.ts` helpers (`apiJson`, `apiFormJson`, `authHeader` already wired there), matching how the route already calls them:

- `type Status = "pending" | "present" | "absent"`
- `type AttendanceEntry = { status: Status; source: "ai" | "manual"; similarity: number | null }`
- `getTodayAttendance(courseId)` — GET today's records, returning `{ records: [{ student_id, status, marked_by, similarity }] }`, so an empty/unavailable response leaves the page on a blank roster instead of erroring.
- `recognizeAttendanceFrame(courseId, imageBlob)` — multipart POST of the captured frame to the recognition endpoint, returning the recognized `{ student_id, similarity }` list.
- `saveAttendance(courseId, rows)` — POST/PUT the final per-student statuses.

Then remove the duplicated marks/course helpers from `attendance-api.ts` that already live in `academic-data.ts`, so there is one source of truth and the route keeps importing course/roster data from `academic-data.ts` as it does today.

## Note on the sync question

This confirms the earlier diagnosis: the commit's route file arrived, but the matching `attendance-api.ts` did not — the two sides are out of step. If you have the repo's version of that file, paste it and I'll use it verbatim instead of reconstructing the functions. Otherwise I'll write them against the endpoint shapes the route already expects.

## Verification

- Typecheck clean (currently 9 errors, all in this one file).
- Load `/teacher/attendance/<courseId>` in the preview and confirm the roster renders with no console error.
