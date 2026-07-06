# SMS Frontend

Student Management System — role-based dashboards (Super Admin, HOD, Teacher, Student)
built on the ER diagram: ROLE → USER → {SUPERADMIN|TEACHER|STUDENT}_PROFILE, DEPARTMENT →
SEMESTER → COURSE, ENROLLMENT, INTERNAL_MARKS, ATTENDANCE, RESULT.

## Design language: "Registrar's Card Catalog"

Every field renders as a small floating index card with a mono label tab, like an entry
in a university records drawer. Palette: paper `#FAF8F1`, ink `#1E2430`, indigo `#3A4A78`
(primary), sage (approved), amber (pending), brick (danger/inactive). Display face
**Fraunces**, body **Inter**, data/codes **IBM Plex Mono**.

## Run it

```bash
npm install
npm run dev
```

Then visit `http://localhost:5173` — it redirects to `/admin`.

## What's built (Module 1 — Super Admin)

- **Project scaffold**: Vite + React + Tailwind, fonts wired in `index.html`.
- **UI primitives** (`src/components/ui/`): `AttributeCard`, `RecordStrip`, `RecordList`,
  `FloatingModal`, `Pill`, `Button`, `SearchInput` — all data-agnostic, reused by every role.
- **Shared layout** (`src/components/layout/`): `DashboardShell`, `Sidebar`, `Topbar` —
  driven entirely by `src/config/roleConfig.js`, so no role-specific branching lives in
  the shell itself.
- **Super Admin pages**:
  - `/admin` — Overview: headline metrics as floating cards + department summary grid.
  - `/admin/departments` — full CRUD: search, add/edit via `FloatingModal`, delete,
    rendered as a `RecordList` of `RecordStrip`s.

## Not yet built (next steps)

- Super Admin: Users & Roles, Semesters & Courses, Enrollment Approvals, Results Publishing
  (routes are commented in `App.jsx`, ready to slot in).
- HOD, Teacher, Student modules — `roleConfig.js` already defines their nav; only their
  `features/<role>/pages/*` need building, reusing the same primitives and `DashboardShell`.
- `src/lib/api/` — currently empty; mock data in `src/data/mock/` is shaped to match
  future FastAPI response payloads, so swapping is a matter of replacing the import with
  a fetch call.

## Note on environment

This was built and reviewed without a network connection available in the build sandbox,
so `npm install` / `npm run dev` haven't been executed end-to-end here — please run them
locally and flag anything that breaks.
