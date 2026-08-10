import os
import uuid

from sqlalchemy import or_
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime

from api.database import get_db
from api.models import (
    User, RoleEnum, Teacher, TeacherDepartment, Course, Enrollment, Student, InternalMark, Notice,
    TeacherActivity, Department, AttendanceRecord, AttendanceStatus,
)
from api.auth import require_role
from api.activity import log_teacher_activity
from api.schemas import (
    CourseOut, StudentMarkRow, SaveMarksRequest, FIELD_MAX, NoticeOut, SearchResultOut,
    TeacherMeOut, TeacherActivityOut, UpdateTeacherContactRequest, TeacherDepartmentOut,
    TeacherPerformanceStudentRow, TeacherCoursePerformanceOut,
    TeacherCourseOfferingSummary, TeacherCourseAggregatePerformanceOut,
)

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def _current_teacher(db: Session, current_user: User) -> Teacher:
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")
    return teacher


def _teacher_me_out(teacher: Teacher, current_user: User) -> TeacherMeOut:
    return TeacherMeOut(
        id=teacher.id,
        name=teacher.name,
        title=teacher.title,
        email=teacher.email or current_user.email,
        phone=teacher.phone,
        office=teacher.office,
        office_hours=teacher.office_hours,
        qualification=teacher.qualification,
        specialization=teacher.specialization,
        experience=teacher.experience,
        photo=teacher.photo,
        username=current_user.email.split("@")[0] if current_user.email else str(teacher.id),
        must_change_password=current_user.must_change_password,
        two_factor_enabled=current_user.totp_enabled,
    )


@router.get("/me", response_model=TeacherMeOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = _current_teacher(db, current_user)
    return _teacher_me_out(teacher, current_user)


@router.patch("/me", response_model=TeacherMeOut)
def update_my_contact(
    payload: UpdateTeacherContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    """Self-service contact edit. Name stays admin-managed, same as the rest
    of the teacher record."""
    teacher = _current_teacher(db, current_user)
    if payload.email is not None:
        email = payload.email.strip()
        if not email:
            raise HTTPException(status_code=400, detail="Email cannot be empty")
        teacher.email = email
    if payload.phone is not None:
        teacher.phone = payload.phone.strip() or None
    if payload.office is not None:
        teacher.office = payload.office.strip() or None
    if payload.office_hours is not None:
        teacher.office_hours = payload.office_hours.strip() or None
    if payload.qualification is not None:
        teacher.qualification = payload.qualification.strip() or None
    if payload.specialization is not None:
        teacher.specialization = payload.specialization.strip() or None

    log_teacher_activity(db, teacher.id, icon="message", title="Profile updated", desc="Contact details updated")
    db.commit()
    db.refresh(teacher)
    return _teacher_me_out(teacher, current_user)


PROFILE_PHOTOS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "profile_photos"
)
PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
PROFILE_PHOTO_ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".webp"}


@router.post("/me/photo", response_model=TeacherMeOut)
async def upload_my_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = _current_teacher(db, current_user)

    original_name = file.filename or "photo"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in PROFILE_PHOTO_ALLOWED_EXT:
        allowed = ", ".join(sorted(PROFILE_PHOTO_ALLOWED_EXT))
        raise HTTPException(status_code=400, detail=f"Unsupported image type '{ext}'. Allowed: {allowed}")

    data = await file.read()
    if len(data) > PROFILE_PHOTO_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image is larger than the 5 MB limit")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")

    os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
    stored_name = f"teacher-{teacher.id}-{uuid.uuid4().hex}{ext}"
    with open(os.path.join(PROFILE_PHOTOS_DIR, stored_name), "wb") as f:
        f.write(data)

    # only clean up the old file if it's one we saved ourselves — an admin
    # may have set teacher.photo to some external URL, which isn't ours to delete
    if teacher.photo and teacher.photo.startswith("/uploads/profile-photos/"):
        old_path = os.path.join(PROFILE_PHOTOS_DIR, os.path.basename(teacher.photo))
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    teacher.photo = f"/uploads/profile-photos/{stored_name}"
    log_teacher_activity(db, teacher.id, icon="message", title="Profile updated", desc="Profile picture updated")
    db.commit()
    db.refresh(teacher)
    return _teacher_me_out(teacher, current_user)


@router.get("/activity", response_model=list[TeacherActivityOut])
def list_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = _current_teacher(db, current_user)
    return (
        db.query(TeacherActivity)
        .filter(TeacherActivity.teacher_id == teacher.id)
        .order_by(TeacherActivity.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )


@router.get("/departments", response_model=list[TeacherDepartmentOut])
def list_my_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    """Departments this teacher is actually assigned to (TeacherDepartment),
    not the full institution-wide department list — used to scope filter
    dropdowns like the one on the My Courses page."""
    teacher = _current_teacher(db, current_user)
    dept_ids = [
        row.department_id
        for row in db.query(TeacherDepartment).filter(TeacherDepartment.teacher_id == teacher.id).all()
    ]
    if not dept_ids:
        return []
    return (
        db.query(Department)
        .filter(Department.id.in_(dept_ids))
        .order_by(Department.name.asc())
        .all()
    )


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
    course = _get_owned_course(db, current_user, course_id)
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
        # status is untouched here on purpose — teachers only ever save drafts.
        # Publishing is the HOD's call (see api/routers/hod.py), made after
        # reviewing/adjusting marks — teachers have no publish endpoint here.

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    log_teacher_activity(
        db, teacher.id, icon="award",
        title="Marks saved",
        desc=f"{course.code} {course.name} · {len(payload.rows)} student{'s' if len(payload.rows) != 1 else ''}",
    )

    db.commit()
    return {"saved": len(payload.rows)}


TOTAL_MARKS = sum(FIELD_MAX.values())  # 50


def _attendance_pct(records: list[AttendanceRecord]) -> float:
    """Same rule HOD's attendance report uses: 'pending' rows haven't been
    marked present/absent yet, so they don't count toward the percentage
    either way."""
    marked = [r for r in records if r.status != AttendanceStatus.pending]
    if not marked:
        return 0.0
    present = sum(1 for r in marked if r.status == AttendanceStatus.present)
    return round(present / len(marked) * 100, 1)


def _course_performance_rows(db: Session, course_id: str) -> list[TeacherPerformanceStudentRow]:
    """Per-student attendance % + internal marks total for a single course
    offering. Shared by the single-offering and cross-offering aggregate
    endpoints below so the two never drift out of sync."""
    student_ids = [e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()]
    students = db.query(Student).filter(Student.id.in_(student_ids)).order_by(Student.enrollment.asc()).all()

    marks_by_student = {
        m.student_id: m for m in db.query(InternalMark).filter(InternalMark.course_id == course_id).all()
    }

    attendance_by_student: dict[str, list[AttendanceRecord]] = {}
    for r in db.query(AttendanceRecord).filter(AttendanceRecord.course_id == course_id).all():
        attendance_by_student.setdefault(r.student_id, []).append(r)

    rows: list[TeacherPerformanceStudentRow] = []
    for s in students:
        m = marks_by_student.get(s.id)
        marks_total = sum(getattr(m, field, 0) for field in FIELD_MAX) if m else 0
        rows.append(TeacherPerformanceStudentRow(
            student_id=s.id,
            name=s.name,
            enrollment=s.enrollment,
            attendance_pct=_attendance_pct(attendance_by_student.get(s.id, [])),
            marks_total=marks_total,
        ))
    return rows


def _avg(values: list[float]) -> float:
    return round(sum(values) / len(values), 1) if values else 0.0


@router.get("/courses/{course_id}/performance", response_model=TeacherCoursePerformanceOut)
def get_course_performance(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    course = _get_owned_course(db, current_user, course_id)
    rows = _course_performance_rows(db, course_id)

    return TeacherCoursePerformanceOut(
        course_id=course.id,
        code=course.code,
        name=course.name,
        credits=course.credits or 0,
        enrolled=len(rows),
        avg_attendance=_avg([r.attendance_pct for r in rows]),
        avg_marks=_avg([r.marks_total for r in rows]),
        total_marks=TOTAL_MARKS,
        students=rows,
    )


@router.get("/courses/by-code/{code}/performance", response_model=TeacherCourseAggregatePerformanceOut)
def get_course_aggregate_performance(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    """Combined performance across every section/semester offering of `code`
    that this teacher is assigned to — the course-level summary shown before
    the teacher drills into one specific offering."""
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")

    offerings = (
        db.query(Course)
        .filter(Course.teacher_id == teacher.id, Course.code == code)
        .order_by(Course.sem.asc())
        .all()
    )
    if not offerings:
        raise HTTPException(status_code=404, detail="Course not found or not assigned to you")

    all_rows: list[TeacherPerformanceStudentRow] = []
    offering_summaries: list[TeacherCourseOfferingSummary] = []
    for c in offerings:
        rows = _course_performance_rows(db, c.id)
        all_rows.extend(rows)
        section = c.id.split("-")[-2] if "-" in c.id else "d"
        offering_summaries.append(TeacherCourseOfferingSummary(
            id=c.id,
            sem=c.sem or 0,
            section=section,
            enrolled=len(rows),
            avg_attendance=_avg([r.attendance_pct for r in rows]),
            avg_marks=_avg([r.marks_total for r in rows]),
        ))

    first = offerings[0]
    return TeacherCourseAggregatePerformanceOut(
        code=first.code,
        name=first.name,
        credits=first.credits or 0,
        enrolled=len(all_rows),
        avg_attendance=_avg([r.attendance_pct for r in all_rows]),
        avg_marks=_avg([r.marks_total for r in all_rows]),
        total_marks=TOTAL_MARKS,
        students=all_rows,
        offerings=offering_summaries,
    )


@router.get("/notices", response_model=list[NoticeOut])
def list_department_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher)),
):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="No teacher profile linked to this account")

    dept_ids = [
        row.department_id
        for row in db.query(TeacherDepartment).filter(TeacherDepartment.teacher_id == teacher.id).all()
    ]

    notices = (
        db.query(Notice)
        .filter(
            Notice.department_id.in_(dept_ids) if dept_ids else False,
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