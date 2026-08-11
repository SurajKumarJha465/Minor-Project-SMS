"""
Seed script — Information Technology final results (CourseGrade).

Must run AFTER seed.py (it imports DEPARTMENT_ID/SECTIONS/IT_STUDENTS and
the sem II/IV COURSE_TEMPLATES from there, and looks up the Course rows
seed.py already created). Re-run order: `uv run -m api.seed` then
`uv run -m api.seed_results`. Idempotent — re-running only fills in rows
that don't exist yet.

seed.py only ever created Course rows for the semesters a cohort is
CURRENTLY sitting (II/IV/VI), since that's all the real roster/teacher
sheet covered. Results, by definition, need completed *past* semesters:
a student now in sem 4 has finished I–III, one now in sem 6 has finished
I–V. Sem II and IV already exist from seed.py and are reused as-is; sem
I, III and V are new here, added via HISTORICAL_COURSE_TEMPLATES.

Subjects/codes for I, III, V come from the four real transcripts below —
not from any spreadsheet, since (like the sem VI Project/Elective rows in
seed.py) no real per-teacher roster exists for a completed semester.
Codes follow the same PREFIX NNN convention seed.py established
(MTH/ELX/CMP/CT/ENG/MGT + a number in the semester's hundred-range);
credits are invented, following the same 2-for-a-practice-or-management
course / 3-for-everything-else pattern already visible in seed.py's own
templates. teacher_id is intentionally left unassigned for all of these
(same precedent as "Project I"/"Elective I" in seed.py) — scope here is
results, not backfilling a historical teaching roster.

Real data: the four transcripts supplied are Dip Kiran Limbu (231512),
Sumit Kumar Das (231536), Suraj Kumar Jha (231537) and Anamika Aryal
(231502) — all section "d", currently sem 6, so all five completed
semesters (I–V) are seeded exactly as shown on each transcript. One
wrinkle: Sumit's sem-4 sheet lists "Microprocessor and Computer
Architecture" twice (an initial F, then a second A- row after a retake,
with that semester's SGPA left as "-"). CourseGrade has one row per
(student, course), so that's recorded as the final A- rather than the
superseded F.

Everyone else on the IT roster (357 students) gets generated grades: no
real transcript exists for them, so each is given a fixed "ability" score
(seeded off their CRN, so re-running this script reproduces the same
grades rather than drifting) that skews a weighted grade draw per course,
the same way one real student tends to run consistently strong across
their transcript while another runs more mixed — rather than every course
being an independent coin flip.
"""
import random

from api.database import SessionLocal, engine, Base
from api.models import Course, Student, CourseGrade, MarkStatus
from api.grading import VALID_GRADES
from api.seed import DEPARTMENT_ID, SECTIONS, IT_STUDENTS, COURSE_TEMPLATES as CURRENT_COURSE_TEMPLATES

Base.metadata.create_all(bind=engine)

# (code, name, sem, credits) — see module docstring for how these were derived.
HISTORICAL_COURSE_TEMPLATES = [
    # --- Semester I ---
    ("PHY 111", "Applied Physics", 1, 3),
    ("EE 111", "Basic Electrical Engineering", 1, 3),
    ("MTH 112", "Calculus I", 1, 3),
    ("ELX 111", "Electronics Devices and Circuits", 1, 3),
    ("CMP 113", "Problem Solving Techniques", 1, 2),
    ("CMP 111", "Programming in C", 1, 3),
    # --- Semester III ---
    ("CMP 213", "Advanced Programming with Java", 3, 3),
    ("MTH 213", "Calculus II", 3, 3),
    ("CMP 211", "Data Structure and Algorithms", 3, 3),
    ("ELX 211", "Instrumentation", 3, 3),
    ("MTH 212", "Probability & Statistics", 3, 3),
    ("CMP 212", "Software Engineering Fundamentals", 3, 3),
    # --- Semester V ---
    ("CMP 313", "Computer Graphics", 5, 3),
    ("MGT 311", "Entrepreneurship and Professional Practice", 5, 2),
    ("CT 313", "IT Architecture", 5, 3),
    ("CT 312", "Multimedia Systems", 5, 3),
    ("MTH 311", "Numerical Methods", 5, 3),
    ("ENG 311", "Research Fundamentals", 5, 2),
    ("ELX 311", "Signal, System and Processing", 5, 3),
]

# Courses-by-semester, keyed by code, for every completed semester (I-V).
# Sem II/IV reuse seed.py's own templates (already seeded as Course rows);
# sem I/III/V come from HISTORICAL_COURSE_TEMPLATES above.
COURSES_BY_SEM: dict[int, list[tuple[str, str, int]]] = {1: [], 2: [], 3: [], 4: [], 5: []}
for code, name, sem, credits in HISTORICAL_COURSE_TEMPLATES:
    COURSES_BY_SEM[sem].append((code, name, credits))
for code, name, sem, credits, _teacher_spec in CURRENT_COURSE_TEMPLATES:
    if sem in (2, 4):
        COURSES_BY_SEM[sem].append((code, name, credits))


def _code_slug(code: str) -> str:
    return code.lower().replace(" ", "").replace("-", "")


def _course_id(sem: int, section_id: str, code: str) -> str:
    return f"{DEPARTMENT_ID}-{sem}-{section_id}-{_code_slug(code)}"


# --- real transcripts: {crn: {sem: {code: grade}}} ---
REAL_RESULTS: dict[str, dict[int, dict[str, str]]] = {
    "231536": {  # Sumit Kumar Das
        1: {"PHY 111": "A", "EE 111": "B", "MTH 112": "A", "ELX 111": "B+", "CMP 113": "A", "CMP 111": "A"},
        2: {"MTH 116": "A", "MEC 115": "A-", "ENG 111": "B", "ELX 112": "B", "CMP 116": "A-", "CMP 117": "A-", "CMP 118": "A"},
        3: {"CMP 213": "A-", "MTH 213": "B+", "CMP 211": "A-", "ELX 211": "A-", "MTH 212": "B+", "CMP 212": "B-"},
        4: {"MTH 214": "B+", "CMP 214": "B", "CMP 215": "A-", "ELX 213": "A-", "CT 214": "B", "CT 215": "A-"},
        5: {"CMP 313": "A-", "MGT 311": "B+", "CT 313": "B", "CT 312": "A-", "MTH 311": "B+", "ENG 311": "B", "ELX 311": "B+"},
    },
    "231502": {  # Anamika Aryal
        1: {"PHY 111": "A", "EE 111": "A", "MTH 112": "A", "ELX 111": "A", "CMP 113": "A", "CMP 111": "A"},
        2: {"MTH 116": "A", "MEC 115": "A", "ENG 111": "A", "ELX 112": "A", "CMP 116": "A-", "CMP 117": "A-", "CMP 118": "A"},
        3: {"CMP 213": "A-", "MTH 213": "B+", "CMP 211": "B+", "ELX 211": "A", "MTH 212": "A-", "CMP 212": "A"},
        4: {"MTH 214": "A", "CMP 214": "A", "CMP 215": "A-", "ELX 213": "B+", "CT 214": "A-", "CT 215": "A-"},
        5: {"CMP 313": "A", "MGT 311": "A", "CT 313": "A-", "CT 312": "A-", "MTH 311": "B", "ENG 311": "B", "ELX 311": "A-"},
    },
    "231537": {  # Suraj Kumar Jha
        1: {"PHY 111": "A-", "EE 111": "B", "MTH 112": "B-", "ELX 111": "A", "CMP 113": "A", "CMP 111": "A"},
        2: {"MTH 116": "A", "MEC 115": "A", "ENG 111": "A", "ELX 112": "A", "CMP 116": "A", "CMP 117": "A", "CMP 118": "A"},
        3: {"CMP 213": "A", "MTH 213": "B+", "CMP 211": "A", "ELX 211": "A", "MTH 212": "A-", "CMP 212": "A-"},
        4: {"MTH 214": "B+", "CMP 214": "A", "CMP 215": "A-", "ELX 213": "A-", "CT 214": "A-", "CT 215": "A-"},
        5: {"CMP 313": "A", "MGT 311": "A", "CT 313": "A-", "CT 312": "A-", "MTH 311": "A-", "ENG 311": "A-", "ELX 311": "A"},
    },
    "231512": {  # Dip Kiran Limbu
        1: {"PHY 111": "A", "EE 111": "A", "MTH 112": "A", "ELX 111": "A", "CMP 113": "A", "CMP 111": "A"},
        2: {"MTH 116": "A", "MEC 115": "A", "ENG 111": "A-", "ELX 112": "A", "CMP 116": "A", "CMP 117": "A-", "CMP 118": "A"},
        3: {"CMP 213": "A-", "MTH 213": "A", "CMP 211": "A-", "ELX 211": "A", "MTH 212": "A-", "CMP 212": "A"},
        4: {"MTH 214": "A-", "CMP 214": "A", "CMP 215": "A", "ELX 213": "B+", "CT 214": "A-", "CT 215": "A-"},
        5: {"CMP 313": "A", "MGT 311": "A-", "CT 313": "A", "CT 312": "A", "MTH 311": "A", "ENG 311": "A-", "ELX 311": "A-"},
    },
}

# ability-weighted grade ladder, low -> high (mirrors GRADE_POINTS in grading.py)
GRADE_LADDER = ["F", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"]
assert all(g in VALID_GRADES for g in GRADE_LADDER)


def _mock_grade(rng: random.Random, ability: float) -> str:
    """Sample one letter grade around a student's ability (0-10 index into
    GRADE_LADDER), with per-course noise so a strong student's transcript
    still varies course to course instead of being a flat row of A's."""
    idx = round(rng.gauss(ability, 1.15))
    idx = max(0, min(len(GRADE_LADDER) - 1, idx))
    return GRADE_LADDER[idx]


def seed():
    db = SessionLocal()
    # fixed seed -> re-running this script from scratch reproduces the same
    # mock grades rather than drifting on every run.
    rng = random.Random(20260811)
    try:
        # --- historical Course rows (sem I/III/V), one per section, same
        # id scheme as seed.py, teacher_id left unassigned (see docstring) ---
        created_courses = 0
        for code, name, sem, credits in HISTORICAL_COURSE_TEMPLATES:
            for section_id, _ in SECTIONS:
                course_id = _course_id(sem, section_id, code)
                if not db.query(Course).filter(Course.id == course_id).first():
                    db.add(Course(
                        id=course_id, code=code, name=name, credits=credits,
                        sem=sem, department_id=DEPARTMENT_ID, section_id=section_id,
                        teacher_id=None,
                    ))
                    created_courses += 1
        db.commit()

        # --- results, per student, for every semester they've completed ---
        created_grades = 0
        real_count = 0
        mock_count = 0
        for crn, name, sem, section_id, email in IT_STUDENTS:
            if not db.query(Student).filter(Student.id == crn).first():
                continue  # seed.py hasn't seeded this student yet

            real_transcript = REAL_RESULTS.get(crn)
            # deterministic per-student ability so re-runs are stable
            ability = random.Random(f"ability-{crn}").gauss(7.6, 1.7)
            ability = max(1.0, min(10.0, ability))

            for csem in range(1, sem):  # every completed semester
                for code, cname, credits in COURSES_BY_SEM.get(csem, []):
                    course_id = _course_id(csem, section_id, code)
                    if not db.query(Course).filter(Course.id == course_id).first():
                        continue  # defensive: shouldn't happen given the tables above

                    existing = db.query(CourseGrade).filter(
                        CourseGrade.student_id == crn, CourseGrade.course_id == course_id
                    ).first()
                    if existing:
                        continue

                    if real_transcript and csem in real_transcript and code in real_transcript[csem]:
                        grade = real_transcript[csem][code]
                        real_count += 1
                    else:
                        grade = _mock_grade(rng, ability)
                        mock_count += 1

                    db.add(CourseGrade(
                        student_id=crn, course_id=course_id, grade=grade,
                        status=MarkStatus.published,
                    ))
                    created_grades += 1
            db.commit()

        print(f"Seeded {created_courses} historical courses (sem I/III/V), "
              f"{created_grades} result rows ({real_count} real, {mock_count} mock) "
              f"across {len(IT_STUDENTS)} IT students.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()