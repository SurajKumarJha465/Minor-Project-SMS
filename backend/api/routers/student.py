import re
from collections import defaultdict

import pyotp
from sqlalchemy import or_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from api.database import get_db
from api.models import User, RoleEnum, Student, Section, Department, Notice, Enrollment, AttendanceRecord, AttendanceStatus, Course, Teacher, InternalMark, MarkStatus, CourseGrade, CalendarEvent
from api.grading import grade_point
from api.auth import require_role
from api.schemas import (
    NoticeOut,
    StudentAttendanceResponse,
    StudentAttendanceSummary,
    StudentCourseAttendanceOut,
    StudentCourseOut,
    StudentInternalMarkRow,
    StudentSemesterCourseOut,
    StudentSemesterResultOut,
    StudentResultsResponse,
    StudentAttendanceDay,
    StudentMeOut,
    UpdateMyProfileRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    TwoFactorStatusResponse,
    EventOut,
)

router = APIRouter(prefix="/api/student", tags=["student"])


def _current_student(db: Session, current_user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=400, detail="No student profile linked to this account")
    return student


# Student ids / enrollment numbers start with a 2-digit enrollment year,
# e.g. "251401" -> enrolled 20{25} = 2025, "231512" -> 2023. Batch spans
# the standard 4-year programme from that year.
_ENROLLMENT_YEAR_RE = re.compile(r"^(\d{2})\d{4,}")


def _derive_batch(student: Student) -> str:
    source = student.id or student.enrollment or ""
    match = _ENROLLMENT_YEAR_RE.match(source)
    if not match:
        return "—"
    year = 2000 + int(match.group(1))
    return f"{year}-{year + 4}"


def _build_student_me(db: Session, student: Student, user: User) -> StudentMeOut:
    dept = db.query(Department).filter(Department.id == student.department_id).first()
    section = db.query(Section).filter(Section.id == student.section_id).first()
    return StudentMeOut(
        id=student.id,
        name=student.name,
        enrollment=student.enrollment,
        email=user.email,  # canonical login email lives on User, not the Student copy
        phone=student.phone,
        address=student.address,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        department=dept.name if dept else (student.department_id or ""),
        section=section.label if section else (student.section_id or "").upper(),
        semester=student.sem or 0,
        batch=_derive_batch(student),
        photo=student.photo,
        username=user.email.split("@")[0] if user.email else student.id,
        must_change_password=user.must_change_password,
        two_factor_enabled=user.totp_enabled,
    )


@router.get("/me", response_model=StudentMeOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    student = _current_student(db, current_user)
    return _build_student_me(db, student, current_user)


@router.patch("/me", response_model=StudentMeOut)
def update_my_profile(
    payload: UpdateMyProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    student = _current_student(db, current_user)

    if payload.phone is not None:
        student.phone = payload.phone
    if payload.address is not None:
        student.address = payload.address
    if payload.guardian_name is not None:
        student.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        student.guardian_phone = payload.guardian_phone

    db.commit()
    db.refresh(student)
    return _build_student_me(db, student, current_user)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """Generates (or regenerates, if setup was abandoned) a TOTP secret.
    The secret isn't active until /2fa/enable confirms a code from it."""
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is already enabled")

    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="Smart Student Management System")
    return TwoFactorSetupResponse(secret=secret, otpauth_url=uri)


@router.post("/2fa/enable", response_model=TwoFactorStatusResponse)
def enable_two_factor(
    payload: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Start 2FA setup first")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    current_user.totp_enabled = True
    db.commit()
    return TwoFactorStatusResponse(enabled=True)


@router.post("/2fa/disable", response_model=TwoFactorStatusResponse)
def disable_two_factor(
    payload: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is not enabled")

    totp = pyotp.TOTP(current_user.totp_secret or "")
    if not totp.verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    return TwoFactorStatusResponse(enabled=False)


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


@router.get("/calendar", response_model=list[EventOut])
def list_my_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """Academic calendar events for the student's own department. Read-only —
    events are created and managed by the HOD (see hod.py's /events routes)."""
    student = _current_student(db, current_user)

    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.department_id == student.department_id)
        .order_by(CalendarEvent.date.asc())
        .all()
    )
    return [
        EventOut(
            id=e.id, title=e.title, type=e.type.value,
            date=e.date.isoformat(), display_date=e.date.strftime("%b %d, %Y"),
        )
        for e in events
    ]


@router.get("/courses", response_model=list[StudentCourseOut])
def list_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """Courses the student is enrolled in, with attendance % and published internal marks.
    Note: there's no "syllabus progress" or course description concept in the data
    model yet, so the frontend card for real courses drops those fields (they were
    mock-only)."""
    student = _current_student(db, current_user)

    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []

    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    teacher_ids = {c.teacher_id for c in courses if c.teacher_id}
    teachers = (
        {t.id: t.name for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}
        if teacher_ids else {}
    )

    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student.id, AttendanceRecord.course_id.in_(course_ids))
        .all()
    )
    by_course_att = defaultdict(list)
    for r in records:
        if r.status != AttendanceStatus.pending:
            by_course_att[r.course_id].append(r.status)

    # Only published marks count towards what a student can see — drafts are
    # the teacher's working copy, same rule the HOD/teacher views follow.
    marks = {
        m.course_id: m
        for m in db.query(InternalMark)
        .filter(
            InternalMark.student_id == student.id,
            InternalMark.course_id.in_(course_ids),
            InternalMark.status == MarkStatus.published,
        )
        .all()
    }

    rows: list[StudentCourseOut] = []
    for c in courses:
        statuses = by_course_att.get(c.id, [])
        present = sum(1 for s in statuses if s == AttendanceStatus.present)
        total = len(statuses)
        pct = round((present / total) * 100, 1) if total else 0.0

        m = marks.get(c.id)
        internal_total = (
            m.p_att + m.p_lab + m.p_exam + m.p_viva + m.t_att + m.t_assign + m.t_present + m.t_assess
            if m else 0
        )

        rows.append(
            StudentCourseOut(
                id=c.id,
                code=c.code,
                name=c.name,
                credits=c.credits or 0,
                teacher=teachers.get(c.teacher_id, "Unassigned"),
                attendance=pct,
                internal=internal_total,
            )
        )
    return rows


@router.get("/internal-marks", response_model=list[StudentInternalMarkRow])
def list_my_internal_marks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """Per-component internal assessment breakdown for every enrolled course.
    Same published-only rule as /courses and /results: a course whose marks
    the teacher/HOD haven't published yet shows up with status="pending" and
    zeroed fields — never the in-progress numbers a teacher is still editing."""
    student = _current_student(db, current_user)

    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    course_ids = [e.course_id for e in enrollments]
    if not course_ids:
        return []

    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
    teacher_ids = {c.teacher_id for c in courses if c.teacher_id}
    teachers = (
        {t.id: t.name for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}
        if teacher_ids else {}
    )

    marks = {
        m.course_id: m
        for m in db.query(InternalMark)
        .filter(InternalMark.student_id == student.id, InternalMark.course_id.in_(course_ids))
        .all()
    }

    rows: list[StudentInternalMarkRow] = []
    for c in sorted(courses, key=lambda c: c.code):
        m = marks.get(c.id)
        published = bool(m) and m.status == MarkStatus.published
        total = (
            m.p_att + m.p_lab + m.p_exam + m.p_viva + m.t_att + m.t_assign + m.t_present + m.t_assess
            if published else 0
        )
        rows.append(StudentInternalMarkRow(
            course_id=c.id, code=c.code, name=c.name,
            teacher=teachers.get(c.teacher_id, "Unassigned"),
            p_att=m.p_att if published else 0, p_lab=m.p_lab if published else 0,
            p_exam=m.p_exam if published else 0, p_viva=m.p_viva if published else 0,
            t_att=m.t_att if published else 0, t_assign=m.t_assign if published else 0,
            t_present=m.t_present if published else 0, t_assess=m.t_assess if published else 0,
            total=total, status="published" if published else "pending",
        ))
    return rows


def _attendance_status_label(pct: float) -> str:
    if pct >= 90:
        return "Excellent"
    if pct >= 75:
        return "Good"
    return "Warning"


@router.get("/results", response_model=StudentResultsResponse)
def list_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """Final semester results, computed from CourseGrade rows. A semester
    only counts as "Published" once every graded course in it is published;
    draft grades never affect what the student sees (same rule InternalMark
    follows). Semesters with zero recorded grades are omitted entirely
    rather than shown as an empty row. 'gpa' here is the SGPA for that one
    semester; 'cgpa' is the cumulative, credit-weighted average across every
    published semester."""
    student = _current_student(db, current_user)

    all_grades = db.query(CourseGrade).filter(CourseGrade.student_id == student.id).all()
    if not all_grades:
        return StudentResultsResponse(cgpa=0.0, results=[], courses_by_semester={})

    course_ids = [g.course_id for g in all_grades]
    courses = {c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()}

    by_sem: dict[int, list[CourseGrade]] = defaultdict(list)
    for g in all_grades:
        course = courses.get(g.course_id)
        if course and course.sem:
            by_sem[course.sem].append(g)

    results: list[StudentSemesterResultOut] = []
    courses_by_semester: dict[int, list[StudentSemesterCourseOut]] = {}
    cgpa_points = 0.0
    cgpa_credits = 0

    for sem in sorted(by_sem):
        rows = by_sem[sem]
        published_rows = [g for g in rows if g.status == MarkStatus.published]
        is_published = bool(rows) and len(published_rows) == len(rows)

        sem_credits = sum(courses[g.course_id].credits or 0 for g in published_rows)
        sem_points = sum(grade_point(g.grade) * (courses[g.course_id].credits or 0) for g in published_rows)
        sem_gpa = round(sem_points / sem_credits, 2) if sem_credits else 0.0

        results.append(StudentSemesterResultOut(
            semester=sem,
            credits=sem_credits,
            gpa=sem_gpa,
            status="Published" if is_published else "Pending",
        ))

        courses_by_semester[sem] = [
            StudentSemesterCourseOut(
                code=courses[g.course_id].code,
                name=courses[g.course_id].name,
                credits=courses[g.course_id].credits or 0,
                grade=g.grade,
                grade_point=grade_point(g.grade),
            )
            for g in rows
        ]

        cgpa_points += sem_points
        cgpa_credits += sem_credits

    cgpa = round(cgpa_points / cgpa_credits, 2) if cgpa_credits else 0.0
    return StudentResultsResponse(cgpa=cgpa, results=results, courses_by_semester=courses_by_semester)


@router.get("/attendance", response_model=StudentAttendanceResponse)
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.student)),
):
    """
    Real attendance for the logged-in student, aggregated from AttendanceRecord.
    Note: AttendanceStatus only has present/absent/pending — there's no
    late/leave concept in the data model, so those don't appear here (the
    old mock UI had them; this endpoint only returns what's actually tracked).
    """
    student = _current_student(db, current_user)

    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    course_ids = [e.course_id for e in enrollments]

    courses = {}
    teachers = {}
    if course_ids:
        courses = {c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()}
        teacher_ids = {c.teacher_id for c in courses.values() if c.teacher_id}
        if teacher_ids:
            teachers = {t.id: t.name for t in db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()}

    records = []
    if course_ids:
        records = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.course_id.in_(course_ids),
            )
            .all()
        )

    by_course = defaultdict(list)
    for r in records:
        by_course[r.course_id].append(r)

    course_rows: list[StudentCourseAttendanceOut] = []
    total_present = 0
    total_absent = 0

    for cid in course_ids:
        course = courses.get(cid)
        if not course:
            continue
        recs = [r for r in by_course.get(cid, []) if r.status != AttendanceStatus.pending]
        present = sum(1 for r in recs if r.status == AttendanceStatus.present)
        absent = sum(1 for r in recs if r.status == AttendanceStatus.absent)
        total = present + absent
        pct = round((present / total) * 100, 1) if total else 0.0
        total_present += present
        total_absent += absent
        course_rows.append(
            StudentCourseAttendanceOut(
                course_id=cid,
                code=course.code,
                name=course.name,
                teacher=teachers.get(course.teacher_id, "Unassigned"),
                present=present,
                absent=absent,
                total=total,
                percentage=pct,
                status=_attendance_status_label(pct),
            )
        )

    overall_total = total_present + total_absent
    overall_pct = round((total_present / overall_total) * 100, 1) if overall_total else 0.0

    # Day-level rollup across all courses: a day counts "present" if the
    # student was present in at least one class that day, else "absent"
    # if marked absent in any class and never present.
    by_day = defaultdict(lambda: {"present": 0, "absent": 0})
    for r in records:
        if r.status == AttendanceStatus.pending:
            continue
        by_day[r.date.isoformat()][r.status.value] += 1

    calendar = [
        StudentAttendanceDay(
            date=day,
            status="present" if counts["present"] > 0 else "absent",
        )
        for day, counts in sorted(by_day.items())
    ]

    return StudentAttendanceResponse(
        summary=StudentAttendanceSummary(
            overall=overall_pct,
            total_classes=overall_total,
            present=total_present,
            absent=total_absent,
        ),
        courses=course_rows,
        calendar=calendar,
    )