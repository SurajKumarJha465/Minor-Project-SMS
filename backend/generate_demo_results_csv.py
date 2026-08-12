"""
Generate a demo results CSV for the HOD "Publish by Semester" import,
using real enrollment/course data from the live DB so the import doesn't
skip every row.

Output matches what /api/hod/semesters/{sem}/results/import-csv expects:
    enrollment,course_code,grade
one row per (student, course) the student is actually enrolled in.

Grades are randomly assigned from a realistic-ish distribution (skewed
toward B/A, a thin tail of C/D/F) purely for demo purposes — this is not
real result data.

Usage (from backend/, with the venv active):
    uv run python scripts/generate_demo_results_csv.py --sem 6
    uv run python scripts/generate_demo_results_csv.py --sem 6 --dept information-technology
    uv run python scripts/generate_demo_results_csv.py --sem 6 --out /tmp/sem6_results.csv
"""
import argparse
import csv
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.database import SessionLocal
from api.models import Course, Enrollment, Student

# Skewed so a demo doesn't look suspiciously perfect or suspiciously bad.
GRADE_WEIGHTS = [
    ("A+", 6), ("A", 10), ("A-", 14),
    ("B+", 18), ("B", 16), ("B-", 12),
    ("C+", 8), ("C", 6), ("C-", 4),
    ("D+", 3), ("D", 2), ("F", 1),
]
GRADES = [g for g, _ in GRADE_WEIGHTS]
WEIGHTS = [w for _, w in GRADE_WEIGHTS]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sem", type=int, required=True, help="Semester number (1-8)")
    parser.add_argument("--dept", type=str, default=None, help="Department id, e.g. 'information-technology'. Omit for all departments.")
    parser.add_argument("--out", type=str, default=None, help="Output CSV path (default: sem{N}_results_demo.csv in cwd)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible output")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    out_path = Path(args.out) if args.out else Path(f"sem{args.sem}_results_demo.csv")

    db = SessionLocal()
    try:
        q = db.query(Course).filter(Course.sem == args.sem)
        if args.dept:
            q = q.filter(Course.department_id == args.dept)
        courses = q.all()

        if not courses:
            print(f"No courses found for semester {args.sem}" + (f" in department '{args.dept}'" if args.dept else ""))
            return

        rows = []
        for course in courses:
            enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).all()
            student_ids = [e.student_id for e in enrollments]
            students = db.query(Student).filter(Student.id.in_(student_ids)).all()

            for student in students:
                grade = random.choices(GRADES, weights=WEIGHTS, k=1)[0]
                rows.append((student.enrollment, course.code, grade))

        if not rows:
            print("Found courses but no enrolled students — nothing to write.")
            return

        with out_path.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["enrollment", "course_code", "grade"])
            writer.writerows(rows)

        courses_desc = ", ".join(sorted({c.code for c in courses}))
        print(f"Wrote {len(rows)} rows across {len(courses)} course(s) ({courses_desc}) to {out_path}")
    finally:
        db.close()


if __name__ == "__main__":
    main()