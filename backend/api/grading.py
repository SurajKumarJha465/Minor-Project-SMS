# Pokhara University uses a 4.0-scale letter grading system, with SGPA/CGPA
# computed as credit-weighted averages of grade points (see
# https://pu.edu.np/examination/academic-system/). Exact grade-point values
# can be tuned per-programme by the exam office; adjust this table if NCIT's
# actual cutoffs differ.
GRADE_POINTS: dict[str, float] = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0,
    "F": 0.0,
}

VALID_GRADES = set(GRADE_POINTS.keys())


def grade_point(letter: str) -> float:
    """Grade point for a letter grade; 0.0 (same as F) for blank/unrecognized input."""
    return GRADE_POINTS.get(letter, 0.0)