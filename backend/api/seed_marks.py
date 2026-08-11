"""
Seed script — Internal marks (InternalMark), fully through the
draft -> publish lifecycle.

Must run AFTER seed.py and seed_ce.py (it looks up Course/Enrollment rows
those scripts already created). Re-run order:
`uv run -m api.seed` then `uv run -m api.seed_ce` then `uv run -m api.seed_marks`.
Idempotent — re-running only fills in rows that don't exist yet.

Scope: every *current* teaching offering (sem II/IV/VI — the only
semesters with real Course/Enrollment rows; sem I/III/V from
seed_results.py are completed-past semesters with no teacher assigned and
are out of scope here) that has a teacher assigned. Courses with no
teacher (Project I/II, Elective I) are skipped — there's no one to have
drafted marks for them.

InternalMark has one row per (student, course) covering both stages of
the workflow at once: the numeric fields ARE what the teacher drafted,
and `status` tracks whether the HOD has since published them. Seeding a
row with status=published simulates the teacher-drafts -> HOD-review ->
HOD-publish cycle having already happened, so the demo doesn't need to
enact it live for every course.

EXCLUDED_COURSE_IDS is the one deliberate gap: CMP 312 "Data
Communication", Information Technology, section D (course_id
"information-technology-6-d-cmp312"). No InternalMark rows are created
for it at all, so the teacher/HOD portals show it completely blank —
that's the one meant to be entered and published live during the demo.

Per-field values are generated from a per-student "ability" ratio (seeded
off CRN, so re-running reproduces the same numbers) plus small per-field
noise, the same style seed_results.py uses for mock grades — so one
student's marks tend to be consistently strong/weak across their courses
rather than every field being an independent coin flip.
"""
import random

from api.database import SessionLocal, engine, Base
from api.models import Course, Enrollment, InternalMark, MarkStatus
from api.schemas import FIELD_MAX

Base.metadata.create_all(bind=engine)

# The one course kept empty for the live demo — see module docstring.
EXCLUDED_COURSE_IDS = {"information-technology-6-d-cmp312"}

CURRENT_SEMS = (2, 4, 6)


def _ability(student_id: str) -> float:
    """Deterministic per-student performance ratio in [0.55, 0.97]."""
    r = random.Random(f"marks-ability-{student_id}").gauss(0.82, 0.09)
    return max(0.55, min(0.97, r))


def _field_value(rng: random.Random, max_val: int, ability: float) -> int:
    ratio = rng.gauss(ability, 0.10)
    ratio = max(0.0, min(1.0, ratio))
    return round(max_val * ratio)


def seed():
    db = SessionLocal()
    try:
        courses = (
            db.query(Course)
            .filter(Course.sem.in_(CURRENT_SEMS), Course.teacher_id.isnot(None))
            .all()
        )

        created = 0
        skipped_excluded = 0
        for course in courses:
            if course.id in EXCLUDED_COURSE_IDS:
                skipped_excluded += 1
                continue

            student_ids = [
                e.student_id for e in
                db.query(Enrollment).filter(Enrollment.course_id == course.id).all()
            ]
            if not student_ids:
                continue

            rng = random.Random(f"marks-{course.id}")
            for student_id in student_ids:
                existing = db.query(InternalMark).filter(
                    InternalMark.student_id == student_id,
                    InternalMark.course_id == course.id,
                ).first()
                if existing:
                    continue

                ability = _ability(student_id)
                fields = {
                    field: _field_value(rng, max_val, ability)
                    for field, max_val in FIELD_MAX.items()
                }
                db.add(InternalMark(
                    student_id=student_id, course_id=course.id,
                    status=MarkStatus.published,
                    **fields,
                ))
                created += 1
            db.commit()

        print(f"Seeded {created} internal-mark rows (published) across "
              f"{len(courses) - skipped_excluded} courses. "
              f"Left {skipped_excluded} course(s) untouched for the live demo: "
              f"{', '.join(sorted(EXCLUDED_COURSE_IDS))}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()