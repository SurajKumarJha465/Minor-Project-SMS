import csv
import io
import os
import uuid

import pyotp
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models import (
    User, RoleEnum, HOD, Student, Section, Department, Enrollment, Course, Teacher, TeacherDepartment,
    department_slug,
    InternalMark, MarkStatus, Notice, NoticeType, CalendarEvent, EventType, CourseGrade, AttendanceRecord,
    AttendanceStatus,
)
from api.grading import VALID_GRADES, grade_point
from api.schemas import (
    CreateStudentRequest, CreateStudentResponse, HodStudentOut, UpdateStudentRequest,
    HodCourseOut, CreateCourseRequest, UpdateCourseRequest, HodTeacherOut, HodAvailableTeacherOut,
    HodCourseRosterStudent,
    EnrollStudentRequest, FIELD_MAX, HodMarksOverview, HodCourseAverage, HodMarkDistributionBucket,
    HodTeacherMarkStatus, HodResultsOverview, HodCoursePassFail, HodRankedStudent,
    NoticeOut, CreateNoticeRequest, UpdateNoticeRequest, HodListingOut, NoticeAttachmentOut,
    UpdateHodContactRequest,
    EventOut, CreateEventRequest, UpdateEventRequest,
    HodGradeRow, SaveGradesRequest, StudentMarkRow, SaveMarksRequest,
    HodAttendanceReport, HodCourseAttendance, HodTeacherAttendance, HodLowAttendanceStudent,
    SearchResultOut,
    SemesterResultImportResponse, SemesterResultImportSkip, HodSemesterCourseSummary, HodSemesterResultsSummary,
    TwoFactorSetupResponse, TwoFactorVerifyRequest, TwoFactorStatusResponse,
)
from api.auth import hash_password, generate_default_password, require_role
from api.database import get_db

router = APIRouter(prefix="/api/hod", tags=["hod"])


def _current_hod(db: Session, current_user: User) -> HOD:
    hod = db.query(HOD).filter(HOD.user_id == current_user.id).first()
    if not hod:
        raise HTTPException(status_code=400, detail="No HOD profile linked to this account")
    return hod

def _department_teacher_ids(db: Session, department_id: str) -> list[int]:
    """Teacher ids that have been added to this department via TeacherDepartment
    (an HOD's own doing) — a teacher can appear in more than one department's list."""
    return [
        row.teacher_id
        for row in db.query(TeacherDepartment).filter(TeacherDepartment.department_id == department_id).all()
    ]


def _department_teachers(db: Session, department_id: str):
    ids = _department_teacher_ids(db, department_id)
    if not ids:
        return []
    return db.query(Teacher).filter(Teacher.id.in_(ids)).all()


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

def _hod_profile_out(db: Session, hod: HOD, current_user: User | None = None) -> HodListingOut:
    dept = db.query(Department).filter(Department.id == hod.department_id).first()
    return HodListingOut(
        id=str(hod.id), name=hod.name, department=dept.name if dept else "",
        email=hod.email or "", phone=hod.phone, qualification=hod.qualification,
        experience=hod.experience, photo=hod.photo,
        must_change_password=current_user.must_change_password if current_user else False,
        two_factor_enabled=current_user.totp_enabled if current_user else False,
    )


@router.get("/me", response_model=HodListingOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)
    return _hod_profile_out(db, hod, current_user)


@router.patch("/me", response_model=HodListingOut)
def update_my_contact(
    payload: UpdateHodContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Self-service contact edit. Deliberately limited to email/phone — name
    and department stay admin-managed, same as the rest of the HOD record."""
    hod = _current_hod(db, current_user)
    if payload.email is not None:
        email = payload.email.strip()
        if not email:
            raise HTTPException(status_code=400, detail="Email cannot be empty")
        hod.email = email
    if payload.phone is not None:
        hod.phone = payload.phone.strip() or None
    db.commit()
    db.refresh(hod)
    return _hod_profile_out(db, hod, current_user)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
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
    current_user: User = Depends(require_role(RoleEnum.hod)),
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
    current_user: User = Depends(require_role(RoleEnum.hod)),
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


PROFILE_PHOTOS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "profile_photos"
)
PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024  # 5 MB
PROFILE_PHOTO_ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".webp"}


@router.post("/me/photo", response_model=HodListingOut)
async def upload_my_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    hod = _current_hod(db, current_user)

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
    stored_name = f"hod-{hod.id}-{uuid.uuid4().hex}{ext}"
    with open(os.path.join(PROFILE_PHOTOS_DIR, stored_name), "wb") as f:
        f.write(data)

    # only clean up the old file if it's one we saved ourselves — an admin
    # may have set hod.photo to some external URL, which isn't ours to delete
    if hod.photo and hod.photo.startswith("/uploads/profile-photos/"):
        old_path = os.path.join(PROFILE_PHOTOS_DIR, os.path.basename(hod.photo))
        if os.path.isfile(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    hod.photo = f"/uploads/profile-photos/{stored_name}"
    db.commit()
    db.refresh(hod)
    return _hod_profile_out(db, hod, current_user)

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

    dept_teacher_ids = _department_teacher_ids(db, hod.department_id)
    teachers = (
        db.query(Teacher)
        .filter(
            Teacher.id.in_(dept_teacher_ids) if dept_teacher_ids else False,
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
        dept_teacher_ids = _department_teacher_ids(db, hod.department_id)
        teacher = (
            db.query(Teacher)
            .filter(Teacher.id == payload.teacher_id, Teacher.id.in_(dept_teacher_ids) if dept_teacher_ids else False)
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
    teachers = _department_teachers(db, hod.department_id)
    result = []
    for t in teachers:
        course_count = db.query(Course).filter(Course.teacher_id == t.id).count()
        result.append(HodTeacherOut(
            id=t.id, name=t.name, specialization=t.specialization, qualification=t.qualification,
            experience=t.experience, email=t.email, phone=t.phone, photo=t.photo, courses=course_count,
        ))
    return result


@router.get("/teachers/available", response_model=list[HodAvailableTeacherOut])
def search_available_teachers(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Teachers not yet in this HOD's department — the pool to pick from when
    adding a teacher to the department. Search is required (min 2 chars) since
    this can span every teacher in the system, not just this department."""
    hod = _current_hod(db, current_user)
    query = q.strip()
    if len(query) < 2:
        return []

    like = f"%{query}%"
    dept_teacher_ids = _department_teacher_ids(db, hod.department_id)
    candidates = (
        db.query(Teacher)
        .filter((Teacher.name.ilike(like)) | (Teacher.email.ilike(like)))
        .filter(~Teacher.id.in_(dept_teacher_ids) if dept_teacher_ids else True)
        .limit(10)
        .all()
    )
    dept_map = {d.id: d.name for d in db.query(Department).all()}
    other_dept_names: dict[int, list[str]] = {}
    for row in db.query(TeacherDepartment).filter(TeacherDepartment.teacher_id.in_([t.id for t in candidates])).all() if candidates else []:
        other_dept_names.setdefault(row.teacher_id, []).append(dept_map.get(row.department_id, row.department_id))

    return [
        HodAvailableTeacherOut(
            id=t.id, name=t.name, specialization=t.specialization, qualification=t.qualification,
            email=t.email, photo=t.photo, departments=other_dept_names.get(t.id, []),
        )
        for t in candidates
    ]


@router.post("/teachers/{teacher_id}/assign", response_model=HodTeacherOut)
def assign_teacher_to_department(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Add an existing teacher account to this HOD's department. This is the
    only way a teacher ends up in a department — admin no longer sets it at
    account-creation time — and a teacher can be added to more than one."""
    hod = _current_hod(db, current_user)
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = (
        db.query(TeacherDepartment)
        .filter(TeacherDepartment.teacher_id == teacher_id, TeacherDepartment.department_id == hod.department_id)
        .first()
    )
    if not existing:
        db.add(TeacherDepartment(teacher_id=teacher_id, department_id=hod.department_id))
        db.commit()

    course_count = db.query(Course).filter(Course.teacher_id == teacher.id).count()
    return HodTeacherOut(
        id=teacher.id, name=teacher.name, specialization=teacher.specialization,
        qualification=teacher.qualification, experience=teacher.experience,
        email=teacher.email, phone=teacher.phone, photo=teacher.photo, courses=course_count,
    )


@router.delete("/teachers/{teacher_id}/assign")
def unassign_teacher_from_department(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Remove a teacher from this HOD's department only — the account and any
    other department memberships are untouched. Blocked while the teacher
    still has courses in this department, so a course never ends up pointing
    at a teacher outside it."""
    hod = _current_hod(db, current_user)
    still_teaching = (
        db.query(Course)
        .filter(Course.teacher_id == teacher_id, Course.department_id == hod.department_id)
        .count()
    )
    if still_teaching:
        raise HTTPException(
            status_code=400,
            detail="Unassign this teacher from their courses in your department first",
        )

    row = (
        db.query(TeacherDepartment)
        .filter(TeacherDepartment.teacher_id == teacher_id, TeacherDepartment.department_id == hod.department_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Teacher not found in your department")
    db.delete(row)
    db.commit()
    return {"removed": teacher_id}

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


@router.post("/semesters/{sem}/results/import-csv", response_model=SemesterResultImportResponse)
async def import_semester_results_csv(
    sem: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Bulk-load an entire semester's final results from one exam-office
    sheet spanning every course, instead of importing course by course.
    Expected columns: 'enrollment', 'course_code', 'grade' — one row per
    (student, course) result. A course code can exist in more than one
    section of the same semester; which exact Course row a row belongs to
    is resolved by finding the course the student is actually enrolled in,
    not by a section column, so the sheet doesn't need to name a section.
    Rows land as drafts — nothing here publishes automatically. Rows that
    don't resolve to exactly one enrolled course, or carry an unrecognized
    grade, are skipped and reported back rather than failing the whole
    import."""
    hod = _current_hod(db, current_user)

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    headers = {f.strip().lower() for f in (reader.fieldnames or [])}
    if not {"enrollment", "course_code", "grade"}.issubset(headers):
        raise HTTPException(status_code=400, detail="CSV must have 'enrollment', 'course_code' and 'grade' columns")

    dept_courses = db.query(Course).filter(Course.department_id == hod.department_id, Course.sem == sem).all()
    courses_by_code: dict[str, list[Course]] = {}
    for c in dept_courses:
        courses_by_code.setdefault(c.code.strip().upper(), []).append(c)

    # not filtered by Student.sem — a repeat/backlog student's *current*
    # semester may have moved on since this result sheet's semester, but
    # their Enrollment row still ties them to the right course below
    students_by_enrollment = {
        s.enrollment: s for s in db.query(Student).filter(Student.department_id == hod.department_id).all()
    }

    saved = 0
    skipped: list[SemesterResultImportSkip] = []
    for row in reader:
        row = {k.strip().lower(): v for k, v in row.items()}
        enrollment = (row.get("enrollment") or "").strip()
        code = (row.get("course_code") or "").strip().upper()
        grade = (row.get("grade") or "").strip().upper()

        student = students_by_enrollment.get(enrollment)
        if not student:
            skipped.append(SemesterResultImportSkip(
                enrollment=enrollment, course_code=code, reason="student not found in this department"))
            continue
        candidates = courses_by_code.get(code, [])
        if not candidates:
            skipped.append(SemesterResultImportSkip(
                enrollment=enrollment, course_code=code, reason=f"no course '{code}' in semester {sem}"))
            continue
        enrolled_course = next(
            (c for c in candidates if db.query(Enrollment).filter(
                Enrollment.course_id == c.id, Enrollment.student_id == student.id
            ).first()),
            None,
        )
        if not enrolled_course:
            skipped.append(SemesterResultImportSkip(
                enrollment=enrollment, course_code=code, reason="student is not enrolled in this course"))
            continue
        if grade not in VALID_GRADES:
            skipped.append(SemesterResultImportSkip(
                enrollment=enrollment, course_code=code, reason=f"unrecognized grade '{grade}'"))
            continue

        record = db.query(CourseGrade).filter(
            CourseGrade.course_id == enrolled_course.id, CourseGrade.student_id == student.id
        ).first()
        if not record:
            record = CourseGrade(course_id=enrolled_course.id, student_id=student.id)
            db.add(record)
        record.grade = grade
        saved += 1

    db.commit()
    return SemesterResultImportResponse(saved=saved, skipped=skipped)


@router.get("/semesters/{sem}/results", response_model=HodSemesterResultsSummary)
def semester_results_summary(
    sem: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Per-course rollup for a semester — how many students are graded vs
    enrolled, and whether that course's grades are fully published — so the
    HOD can review an import before publishing the whole semester at once."""
    hod = _current_hod(db, current_user)
    courses = db.query(Course).filter(Course.department_id == hod.department_id, Course.sem == sem).all()
    course_ids = [c.id for c in courses]

    grades = db.query(CourseGrade).filter(CourseGrade.course_id.in_(course_ids)).all() if course_ids else []
    grades_by_course: dict[str, list[CourseGrade]] = {}
    for g in grades:
        grades_by_course.setdefault(g.course_id, []).append(g)

    enrolled_counts = {
        c.id: db.query(Enrollment).filter(Enrollment.course_id == c.id).count() for c in courses
    }

    summaries = []
    for c in courses:
        rows = grades_by_course.get(c.id, [])
        graded_rows = [g for g in rows if g.grade]
        summaries.append(HodSemesterCourseSummary(
            course_id=c.id, code=c.code, name=c.name, section=(c.section_id or "").upper(),
            graded=len(graded_rows), total_enrolled=enrolled_counts.get(c.id, 0),
            published=bool(graded_rows) and all(g.status == MarkStatus.published for g in graded_rows),
        ))
    return HodSemesterResultsSummary(semester=sem, courses=summaries)


@router.post("/semesters/{sem}/results/publish")
def publish_semester_results(
    sem: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.hod)),
):
    """Publishes every course's CourseGrade rows for this semester in one
    action, instead of publishing course by course."""
    hod = _current_hod(db, current_user)
    course_ids = [
        c.id for c in db.query(Course).filter(Course.department_id == hod.department_id, Course.sem == sem).all()
    ]
    if not course_ids:
        return {"published": 0}
    updated = (
        db.query(CourseGrade)
        .filter(CourseGrade.course_id.in_(course_ids))
        .update({CourseGrade.status: MarkStatus.published}, synchronize_session=False)
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

    # Teachers who actually teach a course in this department — derived from
    # the courses themselves rather than TeacherDepartment membership, so a
    # teacher who's since been unassigned from the department but still has
    # a stray course here isn't silently dropped from the status list.
    course_teacher_ids = {c.teacher_id for c in courses if c.teacher_id}
    teachers = db.query(Teacher).filter(Teacher.id.in_(course_teacher_ids)).all() if course_teacher_ids else []
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

    # same rationale as the marks-overview version above: derive from the
    # department's own courses, not TeacherDepartment membership.
    course_teacher_ids = {c.teacher_id for c in courses if c.teacher_id}
    teachers = db.query(Teacher).filter(Teacher.id.in_(course_teacher_ids)).all() if course_teacher_ids else []
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


NOTICE_ATTACHMENTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "notice_attachments"
)
NOTICE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
NOTICE_ATTACHMENT_ALLOWED_EXT = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt",
}


@router.post("/notices/attachment", response_model=NoticeAttachmentOut)
async def upload_notice_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(RoleEnum.hod)),
    db: Session = Depends(get_db),
):
    """Uploads a file for a notice before the notice itself exists yet — the
    HOD picks a file while composing, this stores it and hands back a URL,
    and that URL rides along in the CreateNoticeRequest/UpdateNoticeRequest
    payload. Kept separate from create/update so the notice form doesn't
    need to be multipart just to support the (optional) attachment."""
    _current_hod(db, current_user)  # just an auth/role check here; file isn't tied to a department row

    original_name = file.filename or "attachment"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in NOTICE_ATTACHMENT_ALLOWED_EXT:
        allowed = ", ".join(sorted(NOTICE_ATTACHMENT_ALLOWED_EXT))
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {allowed}")

    data = await file.read()
    if len(data) > NOTICE_ATTACHMENT_MAX_BYTES:
        raise HTTPException(status_code=400, detail="File is larger than the 10 MB limit")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")

    os.makedirs(NOTICE_ATTACHMENTS_DIR, exist_ok=True)
    # random prefix avoids collisions and stops one HOD's upload from being
    # guessable/overwritable from another notice with the same filename
    stored_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(NOTICE_ATTACHMENTS_DIR, stored_name), "wb") as f:
        f.write(data)

    return NoticeAttachmentOut(
        attachment_url=f"/uploads/notices/{stored_name}",
        attachment_name=original_name,
        attachment_size=len(data),
    )


def _delete_attachment_file(attachment_url: str | None):
    if not attachment_url:
        return
    stored_name = os.path.basename(attachment_url)
    path = os.path.join(NOTICE_ATTACHMENTS_DIR, stored_name)
    if os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass  # not worth failing the request over a stray file on disk


def _notice_out(n: Notice) -> NoticeOut:
    return NoticeOut(
        id=n.id, title=n.title, body=n.body, type=n.type.value,
        audience=n.audience, pinned=n.pinned, author=n.author_name,
        date=n.created_at.strftime("%b %d, %Y"),
        scheduled_for=n.scheduled_for.strftime("%b %d, %Y %I:%M %p") if n.scheduled_for else None,
        attachment_url=n.attachment_url, attachment_name=n.attachment_name, attachment_size=n.attachment_size,
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
        attachment_url=payload.attachment_url, attachment_name=payload.attachment_name,
        attachment_size=payload.attachment_size,
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
    if payload.remove_attachment:
        _delete_attachment_file(notice.attachment_url)
        notice.attachment_url = None
        notice.attachment_name = None
        notice.attachment_size = None
    elif payload.attachment_url is not None:
        # swapping to a newly-uploaded file — drop the old one from disk first
        if notice.attachment_url and notice.attachment_url != payload.attachment_url:
            _delete_attachment_file(notice.attachment_url)
        notice.attachment_url = payload.attachment_url
        notice.attachment_name = payload.attachment_name
        notice.attachment_size = payload.attachment_size

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
    _delete_attachment_file(notice.attachment_url)
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