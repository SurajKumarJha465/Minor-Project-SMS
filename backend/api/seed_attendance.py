"""
Seed script — Attendance history (AttendanceRecord).

Must run AFTER seed.py and seed_ce.py (it looks up Course/Enrollment rows
those scripts already created). Re-run order:
`uv run -m api.seed` then `uv run -m api.seed_ce` then `uv run -m api.seed_attendance`.
Idempotent — re-running only fills in (student, course, date) rows that
don't exist yet, thanks to AttendanceRecord's own unique constraint.

Scope: every *current* teaching offering (sem II/IV/VI) that has a
teacher assigned. Courses with no teacher (Project I/II, Elective I) are
skipped — there's no one who would have been taking attendance for them.
Unlike seed_marks.py, this covers ALL such courses, including CMP 312
"Data Communication" (Information Technology, section D) — internal
marks are the one thing kept blank there for the live demo, attendance is
not.

Session dates: WEEKS_BACK weeks up to END_DATE (deliberately yesterday,
not today, so there's still room to demo taking today's attendance live
if wanted), skipping Saturdays (Nepal's weekly holiday — everything else,
Sun-Fri, is a working day). Sessions/week per course is derived from
credit count (1-3), a reasonable stand-in for contact hours since the
real timetable isn't part of this data set.

Each present/absent roll comes from a deterministic per-student
"reliability" ratio (seeded off CRN) so re-running reproduces the same
history. Rows are also split between "ai" (face-recognition, with a
similarity score) and manual (marked_by = teacher's user id) to mirror
the two ways the real /api/attendance/save endpoint records a source.
"""
import random
from datetime import date, timedelta

from api.database import SessionLocal, engine, Base
from api.models import Course, Enrollment, Teacher, AttendanceRecord, AttendanceStatus

Base.metadata.create_all(bind=engine)

END_DATE = date(2026, 8, 10)   # yesterday relative to "today" (2026-08-11) — see docstring
WEEKS_BACK = 8
NEPAL_WEEKLY_HOLIDAY = 5        # Python weekday(): Monday=0 ... Saturday=5


def _session_dates(credits: int, rng: random.Random) -> list[date]:
    sessions_per_week = max(1, min(3, credits or 1))
    dates: list[date] = []
    week_end = END_DATE
    for _ in range(WEEKS_BACK):
        week_start = week_end - timedelta(days=6)
        candidates = [
            week_start + timedelta(days=i) for i in range(7)
            if (week_start + timedelta(days=i)).weekday() != NEPAL_WEEKLY_HOLIDAY
            and week_start + timedelta(days=i) <= END_DATE
        ]
        if candidates:
            k = min(sessions_per_week, len(candidates))
            dates.extend(rng.sample(candidates, k))
        week_end = week_start - timedelta(days=1)
    return sorted(dates)


def _reliability(student_id: str) -> float:
    """Deterministic per-student presence ratio in [0.55, 0.98]."""
    r = random.Random(f"attendance-reliability-{student_id}").gauss(0.87, 0.09)
    return max(0.55, min(0.98, r))


def seed():
    db = SessionLocal()
    try:
        courses = (
            db.query(Course)
            .filter(Course.sem.in_((2, 4, 6)), Course.teacher_id.isnot(None))
            .all()
        )

        created = 0
        for course in courses:
            enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).all()
            student_ids = [e.student_id for e in enrollments]
            if not student_ids:
                continue

            teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first()
            manual_marker = str(teacher.user_id) if teacher else None

            course_rng = random.Random(f"attendance-sessions-{course.id}")
            sessions = _session_dates(course.credits, course_rng)
            if not sessions:
                continue

            for student_id in student_ids:
                reliability = _reliability(student_id)
                roll_rng = random.Random(f"attendance-rolls-{course.id}-{student_id}")

                for session_date in sessions:
                    existing = db.query(AttendanceRecord).filter(
                        AttendanceRecord.student_id == student_id,
                        AttendanceRecord.course_id == course.id,
                        AttendanceRecord.date == session_date,
                    ).first()
                    if existing:
                        continue

                    present = roll_rng.random() < reliability
                    status = AttendanceStatus.present if present else AttendanceStatus.absent

                    via_ai = roll_rng.random() < 0.7
                    if via_ai:
                        similarity = round(roll_rng.uniform(0.42, 0.95), 3) if present else None
                        marked_by = "ai"
                    else:
                        similarity = None
                        marked_by = manual_marker or "ai"

                    db.add(AttendanceRecord(
                        student_id=student_id, course_id=course.id, date=session_date,
                        status=status, similarity=similarity, marked_by=marked_by,
                    ))
                    created += 1
            db.commit()

        print(f"Seeded {created} attendance records across {len(courses)} courses "
              f"({WEEKS_BACK} weeks up to {END_DATE.isoformat()}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()