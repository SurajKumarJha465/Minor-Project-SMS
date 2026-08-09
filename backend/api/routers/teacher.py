from sqlalchemy import or_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from api.database import get_db
from api.models import User, RoleEnum, Teacher, Course, Enrollment, Student, InternalMark, MarkStatus, Notice
from api.auth import require_role
from api.schemas import (
    CourseOut, StudentMarkRow, SaveMarksRequest, FIELD_MAX, NoticeOut, SearchResultOut,
)

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def _current_teacher(db: Session, current_user: User) -> Teacher:
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")
    return teacher


@router.get("/search", response_model=list[SearchResultOut])
def search_my_courses(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    """Combined lookup scoped to this teacher — their own courses and students enrolled in them."""
    teacher = _current_teacher(db, current_user)
    query = q.strip()
    if len(query) < 2:
        return []

    like = f"%{query}%"
    results: list[SearchResultOut] = []

    courses = (
        db.query(Course)
        .filter(
            Course.teacher_id == teacher.id,
            (Course.name.ilike(like)) | (Course.code.ilike(like)),
        )
        .limit(6)
        .all()
    )
    course_ids = [c.id for c in courses]
    for c in courses:
        results.append(SearchResultOut(
            type="course", id=c.id, name=c.name,
            subtitle=f"{c.code} · Sem {c.sem or '—'}", photo=None,
        ))

    my_course_ids = [c.id for c in db.query(Course).filter(Course.teacher_id == teacher.id).all()]
    if my_course_ids:
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.course_id.in_(my_course_ids))
            .all()
        )
        student_course_map: dict[str, str] = {}
        for e in enrollments:
            student_course_map.setdefault(e.student_id, e.course_id)

        students = (
            db.query(Student)
            .filter(
                Student.id.in_(list(student_course_map.keys())),
                (Student.name.ilike(like)) | (Student.enrollment.ilike(like)),
            )
            .limit(6)
            .all()
        )
        for s in students:
            results.append(SearchResultOut(
                type="student", id=s.id, name=s.name,
                subtitle=f"{s.enrollment or '—'} · Sem {s.sem or '—'}", photo=s.photo,
                meta=student_course_map.get(s.id),
            ))

    return results


@router.get("/courses", response_model=list[CourseOut])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")

    courses = (
        db.query(Course)
        .filter(Course.teacher_id == teacher.id)
        .order_by(Course.sem.asc(), Course.code.asc())
        .all()
    )

    result: list[CourseOut] = []
    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        result.append(
            CourseOut(
                id=c.id,
                code=c.code,
                name=c.name,
                credits=c.credits or 0,
                sem=c.sem or 0,
                dept=c.department_id,
                enrolled=enrolled_count,
            )
        )

    return result

def _get_owned_course(db: Session, current_user: User, course_id: str) -> Course:
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")
    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not assigned to you")
    return course


def _clamp(field: str, value: int) -> int:
    return max(0, min(FIELD_MAX[field], value))


@router.get("/courses/{course_id}/marks", response_model=list[StudentMarkRow])
def get_marks(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    _get_owned_course(db, current_user, course_id)

    student_ids = [e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()]
    students = db.query(Student).filter(Student.id.in_(student_ids)).order_by(Student.enrollment.asc()).all()
    marks_by_student = {
        m.student_id: m for m in db.query(InternalMark).filter(InternalMark.course_id == course_id).all()
    }

    result = []
    for s in students:
        m = marks_by_student.get(s.id)
        result.append(StudentMarkRow(
            student_id=s.id, name=s.name, enrollment=s.enrollment,
            p_att=m.p_att if m else 0, p_lab=m.p_lab if m else 0,
            p_exam=m.p_exam if m else 0, p_viva=m.p_viva if m else 0,
            t_att=m.t_att if m else 0, t_assign=m.t_assign if m else 0,
            t_present=m.t_present if m else 0, t_assess=m.t_assess if m else 0,
            status=m.status.value if m else "draft",
        ))
    return result


@router.put("/courses/{course_id}/marks")
def save_marks(
    course_id: str,
    payload: SaveMarksRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    _get_owned_course(db, current_user, course_id)
    enrolled_ids = {e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()}

    for row in payload.rows:
        if row.student_id not in enrolled_ids:
            raise HTTPException(status_code=400, detail=f"Student {row.student_id} is not enrolled in this course")
        mark = db.query(InternalMark).filter(
            InternalMark.course_id == course_id, InternalMark.student_id == row.student_id
        ).first()
        if not mark:
            mark = InternalMark(course_id=course_id, student_id=row.student_id)
            db.add(mark)
        for field in FIELD_MAX:
            setattr(mark, field, _clamp(field, getattr(row, field)))
        # status is untouched here on purpose — saving a draft never un-publishes,
        # and publishing only happens through the dedicated endpoint below

    db.commit()
    return {"saved": len(payload.rows)}


@router.post("/courses/{course_id}/marks/publish")
def publish_marks(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    _get_owned_course(db, current_user, course_id)
    updated = (
        db.query(InternalMark)
        .filter(InternalMark.course_id == course_id)
        .update({InternalMark.status: MarkStatus.published})
    )
    db.commit()
    return {"published": updated}

@router.get("/notices", response_model=list[NoticeOut])
def list_department_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")

    notices = (
        db.query(Notice)
        .filter(
            Notice.department_id == teacher.department_id,
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