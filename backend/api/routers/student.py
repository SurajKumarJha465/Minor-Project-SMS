from sqlalchemy import or_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from api.database import get_db
from api.models import User, RoleEnum, Student, Notice
from api.auth import require_role
from api.schemas import NoticeOut

router = APIRouter(prefix="/api/student", tags=["student"])


def _current_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="No student profile linked to this account")
    return student


@router.get("/notices", response_model=list[NoticeOut])
def list_my_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    student = _current_student(db, current_user)

    # Same visibility rule as the teacher feed: every published (i.e. not
    # scheduled-for-later) notice in the student's own department. `audience`
    # is a free-text field HODs type by hand (e.g. "Sem 5 - 8"), not a
    # structured value, so — same as teacher.py — we don't try to parse it
    # for per-semester filtering here.
    notices = (
        db.query(Notice)
        .filter(
            Notice.department_id == student.department_id,
            or_(Notice.scheduled_for.is_(None), Notice.scheduled_for <= datetime.utcnow()),
        )
        .order_by(Notice.pinned.desc(), Notice.created_at.desc())
        .all()
    )
    return [
        NoticeOut(
            id=n.id, title=n.title, body=n.body, type=n.type.value,
            audience=n.audience, pinned=n.pinned, author=n.author_name,
            date=n.created_at.strftime("%b %d, %Y"), scheduled_for=None,
        )
        for n in notices
    ]