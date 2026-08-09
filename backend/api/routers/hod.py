import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models import (
    User, RoleEnum, HOD, Student, Section, Department, Enrollment, Course, Teacher, department_slug,
    InternalMark, MarkStatus, Notice, NoticeType, CalendarEvent, EventType, CourseGrade, AttendanceRecord,
    AttendanceStatus,
)
from api.grading import VALID_GRADES, grade_point
from api.schemas import (
    CreateStudentRequest, CreateStudentResponse, HodStudentOut, UpdateStudentRequest,
    HodCourseOut, CreateCourseRequest, UpdateCourseRequest, HodTeacherOut, HodCourseRosterStudent,
    EnrollStudentRequest, FIELD_MAX, HodMarksOverview, HodCourseAverage, HodMarkDistributionBucket,
    HodTeacherMarkStatus, HodResultsOverview, HodCoursePassFail, HodRankedStudent,
    NoticeOut, CreateNoticeRequest, UpdateNoticeRequest, HodListingOut,
    EventOut, CreateEventRequest, UpdateEventRequest,
    HodGradeRow, SaveGradesRequest, StudentMarkRow, SaveMarksRequest,
    HodAttendanceReport, HodCourseAttendance, HodTeacherAttendance, HodLowAttendanceStudent,
    SearchResultOut,
)
from api.auth import hash_password, generate_default_password, require_role
from api.database import get_db

router = APIRouter(prefix="/api/hod", tags=["hod"])


def _current_hod(db: Session, current_user: User) -> HOD:
    hod = db.query(HOD).filter(HOD.user_id == current_user.id).first()
    if not hod:
        raise HTTPException(status_code=400, detail="No HOD profile linked to this account")
    return hod

def _get_department_course(db: Session, hod: HOD, course_id: str) -> Course:
    course = db.query(Course).filter(Course.id == course_id, Course.department_id == hod.department_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in your department")
    return course

def _course_out(db: Session, course: Course) -> HodCourseOut:
    teacher = db.query(Teacher).filter(Teacher.id == course.teacher_id).first() if course.teacher_id else None
    enrolled = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
    return HodCourseOut(
        id=course.id, code=course.code, name=course.name, credits=course.credits or 0,
        sem=course.sem or 0,
        section=(course.section_id or "").upper(),
        teacher_id=teacher.id if teacher else None,
        teacher_name=teacher.name if teacher else None,
        enrolled=enrolled,
    )


def _bulk_student_stats(db: Session, student_ids: list[str]) -> dict[str, dict]:
    """One batched query per metric instead of one query per student (was N+1).

    Returns {student_id: {"courses_enrolled": int, "attendance_pct": float, "gpa": float}}.
    Missing entries default to zeros by the caller.
    """
    stats: dict[str, dict] = {
        sid: {"courses_enrolled": 0, "attendance_pct": 0.0, "gpa": 0.0} for sid in student_ids
    }
    if not student_ids:
        return stats

    for sid, count in (
        db.query(Enrollment.student_id, func.count(Enrollment.id))
        .filter(Enrollment.student_id.in_(student_ids))
        .group_by(Enrollment.student_id)
        .all()
    ):
        stats[sid]["courses_enrolled"] = count

    # attendance %: present / (present + absent); "pending" rows aren't decided yet so excluded
    for sid, status, count in (
        db.query(AttendanceRecord.student_id, AttendanceRecord.status, func.count(AttendanceRecord.id))
        .filter(AttendanceRecord.student_id.in_(student_ids), AttendanceRecord.status != AttendanceStatus.pending)
        .group_by(AttendanceRecord.student_id, AttendanceRecord.status)
        .all()
    ):
        entry = stats[sid].setdefault("_att_counts", {"present": 0, "absent": 0})
        entry[status.value] = count
    for sid in student_ids:
        counts = stats[sid].pop("_att_counts", None)
        if counts:
            total = counts["present"] + counts["absent"]
            stats[sid]["attendance_pct"] = round(counts["present"] / total * 100, 1) if total else 0.0

    # GPA: credit-weighted average grade point over published, graded CourseGrade rows
    grade_rows = (
        db.query(CourseGrade.student_id, CourseGrade.grade, Course.credits)
        .join(Course, Course.id == CourseGrade.course_id)
        .filter(
            CourseGrade.student_id.in_(student_ids),
            CourseGrade.status == MarkStatus.published,
            CourseGrade.grade != "",
        )
        .all()
    )
    weighted: dict[str, list[float]] = {}
    for sid, grade, credits in grade_rows:
        credits = credits or 0
        w = weighted.setdefault(sid, [0.0, 0.0])  # [credit-weighted points, total credits]
        w[0] += grade_point(grade) * credits
        w[1] += credits
    for sid, (points, credits) in weighted.items():
        stats[sid]["gpa"] = round(points / credits, 2) if credits else 0.0

    return stats

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

@router.get("/search", response_model=list[SearchResultOut])
def search_department(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Combined lookup across this HOD's own department — students, teachers, and courses."""
    hod = _current_hod(db, current_user)
    query = q.strip()
    if len(query) < 2:
        return []

    like = f"%{query}%"
    results: list[SearchResultOut] = []

    students = (
        db.query(Student)
        .filter(
            Student.department_id == hod.department_id,
            (Student.name.ilike(like)) | (Student.enrollment.ilike(like)) | (Student.email.ilike(like)),
        )
        .limit(6)
        .all()
    )
    for s in students:
        results.append(SearchResultOut(
            type="student", id=s.id, name=s.name,
            subtitle=f"{s.enrollment or '—'} · Sem {s.sem or '—'}", photo=s.photo,
            sem=s.sem, section=(s.section_id or "").upper() or None,
        ))

    teachers = (
        db.query(Teacher)
        .filter(
            Teacher.department_id == hod.department_id,
            (Teacher.name.ilike(like)) | (Teacher.email.ilike(like)),
        )
        .limit(6)
        .all()
    )
    for t in teachers:
        results.append(SearchResultOut(
            type="teacher", id=str(t.id), name=t.name,
            subtitle=t.specialization or "Teacher", photo=t.photo,
        ))

    courses = (
        db.query(Course)
        .filter(
            Course.department_id == hod.department_id,
            (Course.name.ilike(like)) | (Course.code.ilike(like)),
        )
        .limit(6)
        .all()
    )
    for c in courses:
        results.append(SearchResultOut(
            type="course", id=c.id, name=c.name,
            subtitle=f"{c.code} · Sem {c.sem or '—'}", photo=None,
        ))

    return results


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

    stats = _bulk_student_stats(db, [s.id for s in students])

    result: list[HodStudentOut] = []
    for s in students:
        result.append(
            HodStudentOut(
                id=s.id,
                name=s.name,
                enrollment=s.enrollment,
                semester=s.sem or 0,
                section=(s.section_id or "").upper(),
                department=dept_name,
                photo=s.photo,
                email=s.email,
                phone=s.phone,
                address=s.address,
                guardian_name=s.guardian_name,
                guardian_phone=s.guardian_phone,
                courses_enrolled=stats[s.id]["courses_enrolled"],
                attendance_pct=stats[s.id]["attendance_pct"],
                gpa=stats[s.id]["gpa"],
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
    stats = _bulk_student_stats(db, [student.id])[student.id]

    return HodStudentOut(
        id=student.id,
        name=student.name,
        enrollment=student.enrollment,
        semester=student.sem or 0,
        section=(student.section_id or "").upper(),
        department=dept.name if dept else hod.department_id,
        photo=student.photo,
        email=student.email,
        phone=student.phone,
        address=student.address,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        courses_enrolled=stats["courses_enrolled"],
        attendance_pct=stats["attendance_pct"],
        gpa=stats["gpa"],
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
    # Clean up every table that FKs to students.id before deleting the row —
    # none of these have ondelete=CASCADE set, so Postgres will reject the
    # delete with an IntegrityError if any of this is skipped.
    db.query(Enrollment).filter(Enrollment.student_id == student.id).delete()
    db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).delete()
    db.query(InternalMark).filter(InternalMark.student_id == student.id).delete()
    db.query(CourseGrade).filter(CourseGrade.student_id == student.id).delete()
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

    # Auto-enroll every student already in this department/semester/section —
    # a new course's roster should start populated with the class it's for.
    matching_students = (
        db.query(Student)
        .filter(
            Student.department_id == hod.department_id,
            Student.sem == payload.sem,
            Student.section_id == section_id,
        )
        .all()
    )
    for student in matching_students:
        db.add(Enrollment(student_id=student.id, course_id=course.id))
    if matching_students:
        db.commit()

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
            section=(s.section_id or "").upper(),
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

    return HodCourseRosterStudent(
        id=student.id, name=student.name, enrollment=student.enrollment, semester=student.sem or 0,
        section=(student.section_id or "").upper(),
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


# --- Internal marks (InternalMark) ---
# Teacher-entered, per-assessment continuous marks. Teachers can only save
# drafts (see api/routers/teacher.py) — the HOD reviews what each teacher
# entered, can correct any field, and is the one who publishes. Same
# draft/publish lifecycle as final results below; students only ever see
# published rows.

@router.get("/courses/{course_id}/marks", response_model=list[StudentMarkRow])
def get_course_marks(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)

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
def save_course_marks(
    course_id: str,
    payload: SaveMarksRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)
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
            setattr(mark, field, max(0, min(FIELD_MAX[field], getattr(row, field))))
        # status untouched here on purpose — same rule as everywhere else:
        # saving a draft never un-publishes; publish is the dedicated step below

    db.commit()
    return {"saved": len(payload.rows)}


@router.post("/courses/{course_id}/marks/publish")
def publish_course_marks(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)
    updated = (
        db.query(InternalMark)
        .filter(InternalMark.course_id == course_id)
        .update({InternalMark.status: MarkStatus.published})
    )
    db.commit()
    return {"published": updated}


# --- Final results (CourseGrade) ---
# Unlike internal marks (teacher-entered, per-assessment), final results come
# from the university exam office as a results sheet and are the HOD's to
# enter/import and publish — teachers never touch this. Manual row entry
# (get/put) and bulk CSV import both write drafts; publish is a separate,
# explicit step, same lifecycle InternalMark already follows.

@router.get("/courses/{course_id}/grades", response_model=list[HodGradeRow])
def get_grades(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)

    student_ids = [e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()]
    students = db.query(Student).filter(Student.id.in_(student_ids)).order_by(Student.enrollment.asc()).all()
    grades_by_student = {
        g.student_id: g for g in db.query(CourseGrade).filter(CourseGrade.course_id == course_id).all()
    }

    result = []
    for s in students:
        g = grades_by_student.get(s.id)
        result.append(HodGradeRow(
            student_id=s.id, name=s.name, enrollment=s.enrollment,
            grade=g.grade if g else "", status=g.status.value if g else "draft",
        ))
    return result


@router.put("/courses/{course_id}/grades")
def save_grades(
    course_id: str,
    payload: SaveGradesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)
    enrolled_ids = {e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()}

    for row in payload.rows:
        if row.student_id not in enrolled_ids:
            raise HTTPException(status_code=400, detail=f"Student {row.student_id} is not enrolled in this course")
        grade = row.grade.strip().upper()
        if grade and grade not in VALID_GRADES:
            raise HTTPException(status_code=400, detail=f"'{grade}' is not a recognized grade")
        record = db.query(CourseGrade).filter(
            CourseGrade.course_id == course_id, CourseGrade.student_id == row.student_id
        ).first()
        if not record:
            record = CourseGrade(course_id=course_id, student_id=row.student_id)
            db.add(record)
        record.grade = grade
        # status untouched here on purpose — same rule as internal marks:
        # saving a draft never un-publishes; publish is a separate step below

    db.commit()
    return {"saved": len(payload.rows)}


@router.post("/courses/{course_id}/grades/import-csv")
async def import_grades_csv(
    course_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Bulk-load final grades from the results CSV the exam office sends.
    Expected columns: 'enrollment' (matches Student.enrollment, e.g.
    'CE-2023-001') and 'grade'. Rows for students not enrolled in this
    course, or with an unrecognized grade, are skipped and reported back
    rather than failing the whole import — this is what lets you import a
    sheet where you only have confirmed results for a handful of students
    rather than the full class."""
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    headers = {f.strip().lower() for f in (reader.fieldnames or [])}
    if not {"enrollment", "grade"}.issubset(headers):
        raise HTTPException(status_code=400, detail="CSV must have 'enrollment' and 'grade' columns")

    enrolled_ids = {e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()}
    students_by_enrollment = {
        s.enrollment: s for s in db.query(Student).filter(Student.id.in_(enrolled_ids)).all()
    }

    saved, skipped = 0, []
    for row in reader:
        row = {k.strip().lower(): v for k, v in row.items()}
        enrollment = (row.get("enrollment") or "").strip()
        grade = (row.get("grade") or "").strip().upper()

        student = students_by_enrollment.get(enrollment)
        if not student:
            skipped.append({"enrollment": enrollment, "reason": "not enrolled in this course"})
            continue
        if grade not in VALID_GRADES:
            skipped.append({"enrollment": enrollment, "reason": f"unrecognized grade '{grade}'"})
            continue

        record = db.query(CourseGrade).filter(
            CourseGrade.course_id == course_id, CourseGrade.student_id == student.id
        ).first()
        if not record:
            record = CourseGrade(course_id=course_id, student_id=student.id)
            db.add(record)
        record.grade = grade
        saved += 1

    db.commit()
    return {"saved": saved, "skipped": skipped}


@router.post("/courses/{course_id}/grades/publish")
def publish_grades(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    _get_department_course(db, hod, course_id)
    updated = (
        db.query(CourseGrade)
        .filter(CourseGrade.course_id == course_id)
        .update({CourseGrade.status: MarkStatus.published})
    )
    db.commit()
    return {"published": updated}


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


LOW_ATTENDANCE_THRESHOLD_PCT = 75.0  # matches the "< 75%" alert threshold shown elsewhere in the HoD UI


def _attendance_pct(records: list[AttendanceRecord]) -> float:
    if not records:
        return 0.0
    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    return round(present / len(records) * 100, 1)


@router.get("/reports/attendance", response_model=HodAttendanceReport)
def attendance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    courses = db.query(Course).filter(Course.department_id == hod.department_id).all()
    course_ids = [c.id for c in courses]

    # "pending" rows haven't been marked present/absent yet, so they don't
    # count toward a percentage either way
    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.course_id.in_(course_ids), AttendanceRecord.status != AttendanceStatus.pending)
        .all()
        if course_ids else []
    )

    overall_pct = _attendance_pct(records)

    by_course = []
    for c in courses:
        rows = [r for r in records if r.course_id == c.id]
        if rows:
            by_course.append(HodCourseAttendance(code=c.code, name=c.name, pct=_attendance_pct(rows)))

    teachers = db.query(Teacher).filter(Teacher.department_id == hod.department_id).all()
    by_teacher = []
    for t in teachers:
        t_course_ids = {c.id for c in courses if c.teacher_id == t.id}
        rows = [r for r in records if r.course_id in t_course_ids]
        if rows:
            by_teacher.append(HodTeacherAttendance(teacher_id=t.id, name=t.name, pct=_attendance_pct(rows)))

    by_student: dict[str, list[AttendanceRecord]] = {}
    for r in records:
        by_student.setdefault(r.student_id, []).append(r)

    low_students = []
    for sid, rows in by_student.items():
        pct = _attendance_pct(rows)
        if pct < LOW_ATTENDANCE_THRESHOLD_PCT:
            s = db.query(Student).filter(Student.id == sid).first()
            if s:
                low_students.append(HodLowAttendanceStudent(
                    id=s.id, name=s.name, enrollment=s.enrollment, semester=s.sem or 0, pct=pct,
                ))
    low_students.sort(key=lambda x: x.pct)

    return HodAttendanceReport(
        overall_pct=overall_pct, total_records=len(records),
        by_course=by_course, by_teacher=by_teacher,
        low_attendance_students=low_students[:20],
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


def _event_out(e: CalendarEvent) -> EventOut:
    return EventOut(
        id=e.id, title=e.title, type=e.type.value,
        date=e.date.isoformat(), display_date=e.date.strftime("%b %d, %Y"),
    )


@router.get("/events", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.department_id == hod.department_id)
        .order_by(CalendarEvent.date.asc())
        .all()
    )
    return [_event_out(e) for e in events]


@router.post("/events", response_model=EventOut)
def create_event(
    payload: CreateEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    try:
        event_type = EventType(payload.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid event type: {payload.type}")

    event = CalendarEvent(
        department_id=hod.department_id, title=payload.title,
        type=event_type, date=payload.date,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_out(event)


@router.patch("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: UpdateEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.department_id == hod.department_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found in your department")

    if payload.title is not None:
        event.title = payload.title
    if payload.type is not None:
        try:
            event.type = EventType(payload.type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid event type: {payload.type}")
    if payload.date is not None:
        event.date = payload.date

    db.commit()
    db.refresh(event)
    return _event_out(event)


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.department_id == hod.department_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found in your department")
    db.delete(event)
    db.commit()
    return {"deleted": event_id}