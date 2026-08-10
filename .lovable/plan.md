# Diagnosis: what bricked the preview

## Root cause

Two files were overwritten with *instruction notes* instead of real code — the "here's the change to make" text (with `BEFORE:` / `AFTER:` comment blocks) was saved directly as the file body, wiping the actual implementation.

### 1. `src/features/Teacher/lib/academic-data.ts` — gutted

The file is now 57 lines and exports only:

- `parseCourseId`
- `CourseOffering`, `GroupedTeacherCourse` types
- `groupTeacherCourses`

Everything else the Teacher module relied on is gone: `semesters`, `sections`, `deptName`, `sectionLabel`, `getTeacherMe`, `getTeacherCourses`, `getAssignedCourses`, `getRosterFor`, `getCourseByCompositeId`, `getRosterForCourse`, and the `TeacherCourse` / `TeacherMeDto` types. It also references `TeacherCourse` on line 39 without that type existing anymore.

Ten files import from it:

```text
src/routes/teacher.courses.tsx        src/routes/teacher.dashboard.tsx
src/routes/teacher.profile.tsx        src/routes/teacher.marks.tsx
src/routes/teacher.reports.tsx        src/routes/teacher.performance.tsx
src/routes/teacher.attendance.index.tsx
src/routes/teacher.attendance.$courseId.tsx
src/features/Teacher/components/Topbar.tsx
src/features/Teacher/components/DrillNav.tsx
```

Those imports now resolve to `undefined`, which is exactly the crash in the dev-server log:

```text
Error in renderToReadableStream: TypeError: Cannot read properties of undefined (reading 'map')
    at CoursesPage (/dev-server/src/routes/teacher.courses.tsx:86:1)
```

Line 86 is `{semesters.map(...)}` — `semesters` no longer exists in the module. Because this throws during SSR of the route the user is on (`/teacher/courses`), the whole page renders blank rather than just one broken card.

### 2. `src/routes/teacher.profile.tsx` — no longer a valid route

The file starts with `// --- teacher.profile.tsx ---`, has an import, then commented-out `BEFORE:` code, then a bare top-level `<CardContent>` JSX expression. It has no `createFileRoute`, no `Route` export, and no component. TanStack's route generator expects a `Route` export from every file in `src/routes`, so this file breaks the route tree in addition to being unparseable as a module.

### 3. Two smaller unrelated breakages in the same batch

- `src/components/safe-avatar-image.tsx:83` — references a name `parsed` three times that is never declared in the file (`TS2304`).
- `src/features/SuperAdmin/components/Topbar.tsx:137` — a JSX element is being passed where a `string` is expected (`TS2322`).

A typecheck run confirms all of the above: ~90 errors, and every one of them is either "Module `@/features/Teacher/lib/academic-data` has no exported member X" (cascading from #1) or one of the two items in this section.

## Fix (not applied — analysis only, per your instruction)

1. Restore `src/features/Teacher/lib/academic-data.ts` to its full prior version, then re-apply only the intended `parseCourseId` parse-from-the-right change and append the new `groupTeacherCourses` helper.
2. Restore `src/routes/teacher.profile.tsx` to the real route file, then re-apply only the "Assigned Courses" `CardContent` block replacement described in the notes.

The cleanest path is a restore of those two files from the last good commit (History), rather than retyping them — the surrounding code in both files was never meant to change.

## Confirmation checks after any fix

- `/teacher/courses`, `/teacher/dashboard`, `/teacher/profile`, `/teacher/reports`, `/teacher/marks`, `/teacher/performance`, `/teacher/attendance` all render.
- No `renderToReadableStream` errors in the dev-server log.
