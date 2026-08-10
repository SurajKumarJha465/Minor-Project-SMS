from sqlalchemy.orm import Session

from api.models import TeacherActivity

# Kept small and dependency-free (no FastAPI imports) so both attendance.py
# and teacher.py can import it without risking a circular import.


def log_teacher_activity(db: Session, teacher_id: int, icon: str, title: str, desc: str) -> None:
    """Append one row to the teacher's activity feed. Caller is still
    responsible for db.commit() — this only adds to the session so it can
    ride along with the caller's existing commit."""
    db.add(TeacherActivity(teacher_id=teacher_id, icon=icon, title=title, desc=desc))