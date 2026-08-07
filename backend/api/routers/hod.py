from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.models import (
    User, RoleEnum, HOD, Student, Section, Department, Enrollment, Course, Teacher, department_slug,
    InternalMark, MarkStatus, Notice, NoticeType,
)
from api.schemas import (
    CreateStudentRequest, CreateStudentResponse, HodStudentOut, UpdateStudentRequest,
    HodCourseOut, CreateCourseRequest, UpdateCourseRequest, HodTeacherOut, HodCourseRosterStudent,
    EnrollStudentRequest, FIELD_MAX, HodMarksOverview, HodCourseAverage, HodMarkDistributionBucket,
    HodTeacherMarkStatus, HodResultsOverview, HodCoursePassFail, HodRankedStudent,
    NoticeOut, CreateNoticeRequest, UpdateNoticeRequest, HodListingOut,
)
from api.auth import hash_password, generate_default_password, require_role
from api.database import get_db

router = APIRouter(prefix="/api/hod", tags=["hod"])


def _current_hod(db: Session, current_user: User) -> HOD:
    hod = db.query(HOD).filter(HOD.user_id == current_user.id).first()
    if not hod:
        raise HTTPException(status_code=400, detail="No HOD profile linked to this account")
    return hod

def _course_out(db: Session, course: Course) -> HodCourseOut:
    section_row = db.query(Section).filter(Section.id == course.section_id).first()
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first() if course.teacher_id else None
    enrolled = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return HodCourseOut(
        id=course.id, code=course.code, name=course.name, credits=course.credits or 0,
        sem=course.sem or 0,
        section=section_row.label if section_row else (course.section_id or "").upper(),
        teacher_id=teacher.id if teacher else None,
        teacher_name=teacher.name if teacher else None,
        enrolled=enrolled,
    )

@router.get("/me", response_model=HodListingOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    dept = db.query(Department).filter(Department.id == hod.department_id).first()
    return HodListingOut(
        id=str(hod.id), name=hod.name, department=dept.name if dept else "",
        email=hod.email or "", phone=hod.phone, qualification=hod.qualification,
        experience=hod.experience, photo=hod.photo,
    )

@router.get("/students", response_model=list[HodStudentOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)

    dept = db.query(Department).filter(Department.id == hod.department_id).first()
    dept_name = dept.name if dept else hod.department_id

    students = (
        db.query(Student)
        .filter(Student.department_id == hod.department_id)
        .order_by(Student.sem.asc(), Student.enrollment.asc())
        .all()
    )

    # section id -> label, fetched once instead of per-row
    section_labels = {s.id: s.label for s in db.query(Section).all()}

    result: list[HodStudentOut] = []
    for s in students:
        courses_enrolled = (
            db.query(Enrollment).filter(Enrollment.student_id == s.id).count()
        )
        result.append(
            HodStudentOut(
                id=s.id,
                name=s.name,
                enrollment=s.enrollment,
                semester=s.sem or 0,
                section=section_labels.get(s.section_id, (s.section_id or "").upper()),
                department=dept_name,
                photo=s.photo,
                email=s.email,
                phone=s.phone,
                address=s.address,
                guardian_name=s.guardian_name,
                guardian_phone=s.guardian_phone,
                courses_enrolled=courses_enrolled,
            )
        )
    return result


@router.post("/students", response_model=CreateStudentResponse)
def create_student(
    payload: CreateStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    # department comes from the logged-in HOD's own record — never trust a value from the payload
    hod = _current_hod(db, current_user)

    if db.query(Student).filter(Student.enrollment == payload.enrollment).first():
        raise HTTPException(status_code=400, detail="A student with this enrollment number already exists")

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    section_id = payload.section.strip().lower()
    if not db.query(Section).filter(Section.id == section_id).first():
        db.add(Section(id=section_id, label=payload.section.strip().upper()))
        db.commit()

    default_password = generate_default_password()
    user = User(
        email=payload.email,
        hashed_password=hash_password(default_password),
        role=RoleEnum.student,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # student id derived from enrollment number, sanitized — also the folder
    # name this student's face photos must eventually be enrolled under in
    # data/enrollment_photos/<id>/ for Virekto recognition to work for them
    student_id = payload.enrollment.strip().lower().replace(" ", "-")

    student = Student(
        id=student_id,
        user_id=user.id,
        name=payload.name,
        enrollment=payload.enrollment,
        department_id=hod.department_id,
        sem=payload.semester,
        section_id=section_id,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
    )
    db.add(student)
    db.commit()

    return CreateStudentResponse(
        student_id=student.id, user_id=user.id, email=user.email,
        default_password=default_password,
    )

@router.patch("/students/{student_id}", response_model=HodStudentOut)
def update_student(
    student_id: str,
    payload: UpdateStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.department_id == hod.department_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your department")

    if payload.email is not None:
        student.email = payload.email
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.address is not None:
        student.address = payload.address
    if payload.semester is not None:
        student.sem = payload.semester
    if payload.section is not None:
        section_id = payload.section.strip().lower()
        if not db.query(Section).filter(Section.id == section_id).first():
            db.add(Section(id=section_id, label=payload.section.strip().upper()))
            db.commit()
        student.section_id = section_id
    if payload.guardian_name is not None:
        student.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        student.guardian_phone = payload.guardian_phone

    db.commit()
    db.refresh(student)

    dept = db.query(Department).filter(Department.id == hod.department_id).first()
    section_row = db.query(Section).filter(Section.id == student.section_id).first()
    courses_enrolled = db.query(Enrollment).filter(Enrollment.student_id == student.id).count()

    return HodStudentOut(
        id=student.id,
        name=student.name,
        enrollment=student.enrollment,
        semester=student.sem or 0,
        section=section_row.label if section_row else (student.section_id or "").upper(),
        department=dept.name if dept else hod.department_id,
        photo=student.photo,
        email=student.email,
        phone=student.phone,
        address=student.address,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        courses_enrolled=courses_enrolled,
    )


@router.delete("/students/{student_id}")
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    student = (
        db.query(Student)
        .filter(Student.id == student_id, Student.department_id == hod.department_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your department")

    user_id = student.user_id
    db.query(Enrollment).filter(Enrollment.student_id == student.id).delete()
    db.delete(student)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    return {"deleted": student_id}

@router.get("/courses", response_model=list[HodCourseOut])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    courses = (
        db.query(Course)
        .filter(Course.department_id == hod.department_id)
        .order_by(Course.sem.asc(), Course.code.asc())
        .all()
    )
    return [_course_out(db, c) for c in courses]


@router.post("/courses", response_model=HodCourseOut)
def create_course(
    payload: CreateCourseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)

    section_id = payload.section.strip().lower()
    if not db.query(Section).filter(Section.id == section_id).first():
        db.add(Section(id=section_id, label=payload.section.strip().upper()))
        db.commit()

    course_id = f"{hod.department_id}-{payload.sem}-{section_id}-{payload.code.lower().replace('-', '')}"
    if db.query(Course).filter(Course.id == course_id).first():
        raise HTTPException(status_code=400, detail="A course with this code already exists for this semester/section")

    course = Course(
        id=course_id, code=payload.code, name=payload.name, credits=payload.credits,
        sem=payload.sem, department_id=hod.department_id, section_id=section_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return _course_out(db, course)


@router.patch("/courses/{course_id}", response_model=HodCourseOut)
def update_course(
    course_id: str,
    payload: UpdateCourseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.department_id == hod.department_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")

    if payload.code is not None:
        course.code = payload.code
    if payload.name is not None:
        course.name = payload.name
    if payload.credits is not None:
        course.credits = payload.credits
    if payload.section is not None:
        section_id = payload.section.strip().lower()
        if not db.query(Section).filter(Section.id == section_id).first():
            db.add(Section(id=section_id, label=payload.section.strip().upper()))
            db.commit()
        course.section_id = section_id

    if payload.unassign_teacher:
        course.teacher_id = None
    elif payload.teacher_id is not None:
        teacher = (
            db.query(Teacher)
            .filter(Teacher.id == payload.teacher_id, Teacher.department_id == hod.department_id)
            .first()
        )
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found in your department")
        course.teacher_id = teacher.id

    db.commit()
    db.refresh(course)
    return _course_out(db, course)


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.department_id == hod.department_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")

    db.query(Enrollment).filter(Enrollment.course_id == course.id).delete()
    db.delete(course)
    db.commit()
    return {"deleted": course_id}


@router.get("/teachers", response_model=list[HodTeacherOut])
def list_department_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    teachers = db.query(Teacher).filter(Teacher.department_id == hod.department_id).all()
    result = []
    for t in teachers:
        course_count = db.query(Course).filter(Course.teacher_id == t.id).count()
        result.append(HodTeacherOut(
            id=t.id, name=t.name, specialization=t.specialization, qualification=t.qualification,
            experience=t.experience, email=t.email, phone=t.phone, photo=t.photo, courses=course_count,
        ))
    return result

@router.get("/courses/{course_id}/roster", response_model=list[HodCourseRosterStudent])
def course_roster(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    course = db.query(Course).filter(Course.id == course_id, Course.department_id == hod.department_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")

    enrolled_ids = {e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()}
    section_labels = {s.id: s.label for s in db.query(Section).all()}

    # eligible pool: department students in the same semester as this course
    students = (
        db.query(Student)
        .filter(Student.department_id == hod.department_id, Student.sem == course.sem)
        .order_by(Student.enrollment.asc())
        .all()
    )

    return [
        HodCourseRosterStudent(
            id=s.id, name=s.name, enrollment=s.enrollment, semester=s.sem or 0,
            section=section_labels.get(s.section_id, (s.section_id or "").upper()),
            photo=s.photo, enrolled=s.id in enrolled_ids,
        )
        for s in students
    ]


@router.post("/courses/{course_id}/enrollments", response_model=HodCourseRosterStudent)
def enroll_student(
    course_id: str,
    payload: EnrollStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    course = db.query(Course).filter(Course.id == course_id, Course.department_id == hod.department_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")

    student = (
        db.query(Student)
        .filter(Student.id == payload.student_id, Student.department_id == hod.department_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in your department")

    exists = db.query(Enrollment).filter(
        Enrollment.student_id == student.id, Enrollment.course_id == course_id
    ).first()
    if not exists:
        db.add(Enrollment(student_id=student.id, course_id=course_id))
        db.commit()

    section_row = db.query(Section).filter(Section.id == student.section_id).first()
    return HodCourseRosterStudent(
        id=student.id, name=student.name, enrollment=student.enrollment, semester=student.sem or 0,
        section=section_row.label if section_row else (student.section_id or "").upper(),
        photo=student.photo, enrolled=True,
    )


@router.delete("/courses/{course_id}/enrollments/{student_id}")
def unenroll_student(
    course_id: str,
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    course = db.query(Course).filter(Course.id == course_id, Course.department_id == hod.department_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")

    db.query(Enrollment).filter(
        Enrollment.student_id == student_id, Enrollment.course_id == course_id
    ).delete()
    db.commit()
    return {"unenrolled": student_id}

TOTAL_MARKS = sum(FIELD_MAX.values())  # 50
PASS_THRESHOLD_PCT = 50.0  # adjust if your programme's actual internal-pass cutoff differs


def _mark_pct(m: InternalMark) -> float:
    total = m.p_att + m.p_lab + m.p_exam + m.p_viva + m.t_att + m.t_assign + m.t_present + m.t_assess
    return round(total / TOTAL_MARKS * 100, 1)


@router.get("/marks/overview", response_model=HodMarksOverview)
def marks_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    courses = db.query(Course).filter(Course.department_id == hod.department_id).all()
    course_ids = [c.id for c in courses]

    published = (
        db.query(InternalMark)
        .filter(InternalMark.course_id.in_(course_ids), InternalMark.status == MarkStatus.published)
        .all()
        if course_ids else []
    )
    pcts = [_mark_pct(m) for m in published]

    avg = round(sum(pcts) / len(pcts), 1) if pcts else 0.0
    highest = lowest = 0.0
    highest_student = lowest_student = None
    if published:
        hi_idx = max(range(len(published)), key=lambda i: pcts[i])
        lo_idx = min(range(len(published)), key=lambda i: pcts[i])
        highest, lowest = pcts[hi_idx], pcts[lo_idx]
        hi_s = db.query(Student).filter(Student.id == published[hi_idx].student_id).first()
        lo_s = db.query(Student).filter(Student.id == published[lo_idx].student_id).first()
        highest_student = hi_s.name if hi_s else None
        lowest_student = lo_s.name if lo_s else None

    buckets = [("0-40", 0, 40), ("40-55", 40, 55), ("55-70", 55, 70), ("70-85", 70, 85), ("85-100", 85, 101)]
    distribution = [
        HodMarkDistributionBucket(range=label, count=sum(1 for p in pcts if lo <= p < hi))
        for label, lo, hi in buckets
    ]

    course_averages = []
    published_course_ids = set()
    for c in courses:
        rows = [m for m in published if m.course_id == c.id]
        if rows:
            published_course_ids.add(c.id)
            course_averages.append(HodCourseAverage(
                code=c.code, name=c.name,
                avg=round(sum(_mark_pct(m) for m in rows) / len(rows), 1),
            ))

    teachers = db.query(Teacher).filter(Teacher.department_id == hod.department_id).all()
    teacher_status = []
    for t in teachers:
        t_courses = [c for c in courses if c.teacher_id == t.id]
        if not t_courses:
            continue
        entered = sum(1 for c in t_courses if c.id in published_course_ids)
        teacher_status.append(HodTeacherMarkStatus(
            teacher_id=t.id, name=t.name, courses=len(t_courses),
            entered=entered, pending=len(t_courses) - entered,
        ))

    return HodMarksOverview(
        avg=avg, highest=highest, highest_student=highest_student,
        lowest=lowest, lowest_student=lowest_student,
        pending_courses=len(courses) - len(published_course_ids),
        total_courses=len(courses),
        course_averages=course_averages, distribution=distribution,
        teacher_status=teacher_status,
    )


@router.get("/marks/results", response_model=HodResultsOverview)
def results_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    courses = db.query(Course).filter(Course.department_id == hod.department_id).all()
    course_ids = [c.id for c in courses]

    published = (
        db.query(InternalMark)
        .filter(InternalMark.course_id.in_(course_ids), InternalMark.status == MarkStatus.published)
        .all()
        if course_ids else []
    )
    pcts = [_mark_pct(m) for m in published]

    avg_pct = round(sum(pcts) / len(pcts), 1) if pcts else 0.0
    passed = sum(1 for p in pcts if p >= PASS_THRESHOLD_PCT)
    pass_pct = round(passed / len(pcts) * 100, 1) if pcts else 0.0
    fail_pct = round(100 - pass_pct, 1) if pcts else 0.0

    pass_fail_by_course = []
    for c in courses:
        rows = [m for m in published if m.course_id == c.id]
        if not rows:
            continue
        p = sum(1 for m in rows if _mark_pct(m) >= PASS_THRESHOLD_PCT)
        pass_fail_by_course.append(HodCoursePassFail(code=c.code, passed=p, failed=len(rows) - p))

    by_student: dict[str, list[float]] = {}
    for m in published:
        by_student.setdefault(m.student_id, []).append(_mark_pct(m))

    ranked = []
    for sid, scores in by_student.items():
        s = db.query(Student).filter(Student.id == sid).first()
        if not s:
            continue
        ranked.append(HodRankedStudent(
            id=s.id, name=s.name, enrollment=s.enrollment, semester=s.sem or 0,
            photo=s.photo, percentage=round(sum(scores) / len(scores), 1),
        ))
    ranked.sort(key=lambda r: r.percentage, reverse=True)
    failing = sorted([r for r in ranked if r.percentage < PASS_THRESHOLD_PCT], key=lambda r: r.percentage)

    return HodResultsOverview(
        avg_percentage=avg_pct, pass_percentage=pass_pct, fail_percentage=fail_pct,
        pass_fail_by_course=pass_fail_by_course,
        top_students=ranked[:5], at_risk_students=failing[:5],
    )

def _notice_out(n: Notice) -> NoticeOut:
    return NoticeOut(
        id=n.id, title=n.title, body=n.body, type=n.type.value,
        audience=n.audience, pinned=n.pinned, author=n.author_name,
        date=n.created_at.strftime("%b %d, %Y"),
        scheduled_for=n.scheduled_for.strftime("%b %d, %Y %I:%M %p") if n.scheduled_for else None,
    )


@router.get("/notices", response_model=list[NoticeOut])
def list_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    notices = (
        db.query(Notice)
        .filter(Notice.department_id == hod.department_id)
        .order_by(Notice.pinned.desc(), Notice.created_at.desc())
        .all()
    )
    return [_notice_out(n) for n in notices]


@router.post("/notices", response_model=NoticeOut)
def create_notice(
    payload: CreateNoticeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    try:
        notice_type = NoticeType(payload.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid notice type: {payload.type}")

    notice = Notice(
        department_id=hod.department_id, title=payload.title, body=payload.body,
        type=notice_type, audience=payload.audience, pinned=payload.pinned,
        author_name=hod.name, scheduled_for=payload.scheduled_for,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return _notice_out(notice)


@router.patch("/notices/{notice_id}", response_model=NoticeOut)
def update_notice(
    notice_id: int,
    payload: UpdateNoticeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.department_id == hod.department_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found in your department")

    if payload.title is not None:
        notice.title = payload.title
    if payload.body is not None:
        notice.body = payload.body
    if payload.type is not None:
        try:
            notice.type = NoticeType(payload.type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid notice type: {payload.type}")
    if payload.audience is not None:
        notice.audience = payload.audience
    if payload.pinned is not None:
        notice.pinned = payload.pinned

    db.commit()
    db.refresh(notice)
    return _notice_out(notice)


@router.delete("/notices/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.department_id == hod.department_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found in your department")
    db.delete(notice)
    db.commit()
    return {"deleted": notice_id}