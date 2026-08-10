import os
import re
from collections import defaultdict
from datetime import datetime, timedelta

import pyotp
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.database import get_db, engine
from api.models import (
    User, RoleEnum, Teacher, TeacherDepartment, Course, HOD, Department, department_slug, Admin, Student,
    Section, Enrollment, SystemSettings, AuditLog,
)
from api.schemas import (
    CreateUserRequest, CreateUserResponse, ChangePasswordRequest,
    CreateTeacherRequest, CreateTeacherResponse,
    CreateHodRequest, CreateHodResponse,
    HodListingOut, UpdateHodRequest,
    TeacherListingOut, UpdateTeacherRequest,
    AdminMeOut, UpdateAdminProfileRequest,
    AdminOverviewOut, AdminDeptTeacherCount, AdminStudentOut, SearchResultOut,
    SettingsOut, UpdateSettingsRequest, BackupTriggerResponse, SystemInfoOut,
    AuditLogOut, TwoFactorSetupResponse, TwoFactorVerifyRequest, TwoFactorStatusResponse,
)
from api.auth import (
    hash_password, verify_password, generate_default_password,
    require_role, get_current_user,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Student ids / enrollment numbers start with a 2-digit enrollment year,
# e.g. "251401" -> enrolled 20{25} = 2025. Batch spans the standard 4-year
# programme from that year. Mirrors the same helper in routers/student.py.
_ENROLLMENT_YEAR_RE = re.compile(r"^(\d{2})\d{4,}")


def _derive_batch(student: Student) -> str:
    source = student.id or student.enrollment or ""
    match = _ENROLLMENT_YEAR_RE.match(source)
    if not match:
        return "—"
    year = 2000 + int(match.group(1))
    return f"{year}-{year + 4}"


APP_VERSION = "Minor-Project-SMS v0.1.0"
_APP_START_TIME = datetime.utcnow()  # process start, used for the System Info uptime figure


def _teacher_department_names(db: Session, teacher_ids: list[int]) -> dict[int, list[str]]:
    """teacher_id -> list of department display names, via the TeacherDepartment
    join table. A teacher with no rows there (bare account, not yet added to
    any department by an HOD) simply gets an empty list."""
    if not teacher_ids:
        return {}
    dept_map = {d.id: d.name for d in db.query(Department).all()}
    rows = db.query(TeacherDepartment).filter(TeacherDepartment.teacher_id.in_(teacher_ids)).all()
    result: dict[int, list[str]] = {tid: [] for tid in teacher_ids}
    for row in rows:
        result.setdefault(row.teacher_id, []).append(dept_map.get(row.department_id, row.department_id))
    return result


def _get_or_create_settings(db: Session) -> SystemSettings:
    settings = db.query(SystemSettings).filter(SystemSettings.id == 1).first()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _log_action(db: Session, settings: SystemSettings, current_user: User, action: str, detail: str | None = None) -> None:
    """No-ops unless the audit_logs toggle is on — this IS the enforcement
    for that setting, not just a display of it."""
    if not settings.audit_logs_enabled:
        return
    db.add(AuditLog(
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action=action,
        detail=detail,
    ))
    db.commit()


@router.get("/settings", response_model=SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    return _get_or_create_settings(db)


@router.patch("/settings", response_model=SettingsOut)
def update_settings(
    payload: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    settings = _get_or_create_settings(db)
    changed_fields = list(payload.dict(exclude_unset=True).keys())
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    _log_action(db, settings, current_user, "settings.update", ", ".join(changed_fields) or None)
    return settings


@router.post("/settings/backup", response_model=BackupTriggerResponse)
def trigger_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    # No real backup job exists yet — this just records when one was
    # requested, so the UI shows a real timestamp instead of a fabricated one.
    settings = _get_or_create_settings(db)
    settings.last_backup_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    _log_action(db, settings, current_user, "settings.backup_triggered")
    return BackupTriggerResponse(last_backup_at=settings.last_backup_at)


@router.get("/settings/system-info", response_model=SystemInfoOut)
def system_info(
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    uptime = int((datetime.utcnow() - _APP_START_TIME).total_seconds())
    return SystemInfoOut(
        version=APP_VERSION,
        environment=os.getenv("APP_ENV", "development"),
        database=engine.dialect.name,
        uptime_seconds=uptime,
    )


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
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
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Start 2FA setup first")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    current_user.totp_enabled = True
    db.commit()
    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "admin.2fa_enabled")
    return TwoFactorStatusResponse(enabled=True)


@router.post("/2fa/disable", response_model=TwoFactorStatusResponse)
def disable_two_factor(
    payload: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="Two-factor authentication is not enabled")

    totp = pyotp.TOTP(current_user.totp_secret or "")
    if not totp.verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "admin.2fa_disabled")
    return TwoFactorStatusResponse(enabled=False)


@router.get("/me", response_model=AdminMeOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    admin = db.query(Admin).filter(Admin.user_id == current_user.id).first()
    if not admin:
        raise HTTPException(status_code=400, detail="No admin profile linked to this account")
    return AdminMeOut(
        name=admin.name, title=admin.title, email=admin.email or current_user.email,
        phone=admin.phone, institution=admin.institution,
        qualification=admin.qualification, experience=admin.experience, photo=admin.photo,
        must_change_password=current_user.must_change_password,
        two_factor_enabled=current_user.totp_enabled,
    )


@router.patch("/me", response_model=AdminMeOut)
def update_my_profile(
    payload: UpdateAdminProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    admin = db.query(Admin).filter(Admin.user_id == current_user.id).first()
    if not admin:
        raise HTTPException(status_code=400, detail="No admin profile linked to this account")

    changed_fields = list(payload.dict(exclude_unset=True).keys())
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(admin, field, value)
    db.commit()
    db.refresh(admin)

    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "admin.profile_update", ", ".join(changed_fields) or None)

    return AdminMeOut(
        name=admin.name, title=admin.title, email=admin.email or current_user.email,
        phone=admin.phone, institution=admin.institution,
        qualification=admin.qualification, experience=admin.experience, photo=admin.photo,
        must_change_password=current_user.must_change_password,
        two_factor_enabled=current_user.totp_enabled,
    )


@router.get("/search", response_model=list[SearchResultOut])
def global_search(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    """Combined lookup across students, teachers, and HODs for the topbar search."""
    query = q.strip()
    if len(query) < 2:
        return []

    like = f"%{query}%"
    dept_map = {d.id: d.name for d in db.query(Department).all()}
    results: list[SearchResultOut] = []

    students = (
        db.query(Student)
        .filter((Student.name.ilike(like)) | (Student.enrollment.ilike(like)) | (Student.email.ilike(like)))
        .limit(6)
        .all()
    )
    for s in students:
        dept = dept_map.get(s.department_id, s.department_id or "")
        results.append(SearchResultOut(
            type="student", id=s.id, name=s.name,
            subtitle=f"{s.enrollment or '—'} · {dept}" if dept else (s.enrollment or ""),
            photo=s.photo,
        ))

    teachers = (
        db.query(Teacher)
        .filter((Teacher.name.ilike(like)) | (Teacher.email.ilike(like)))
        .limit(6)
        .all()
    )
    teacher_dept_names = _teacher_department_names(db, [t.id for t in teachers])
    for t in teachers:
        dept = ", ".join(teacher_dept_names.get(t.id, [])) or "Unassigned"
        results.append(SearchResultOut(
            type="teacher", id=f"T{t.id}", name=t.name, subtitle=dept, photo=t.photo,
        ))

    hods = (
        db.query(HOD)
        .filter((HOD.name.ilike(like)) | (HOD.email.ilike(like)))
        .limit(6)
        .all()
    )
    for h in hods:
        dept = dept_map.get(h.department_id, h.department_id or "")
        results.append(SearchResultOut(
            type="hod", id=f"H{h.id}", name=h.name, subtitle=dept, photo=h.photo,
        ))

    return results


@router.get("/overview", response_model=AdminOverviewOut)
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    dept_map = {d.id: d.name for d in db.query(Department).all()}

    # Teachers per department, keyed by display name — drives the dashboard's bar chart.
    # A teacher in multiple departments counts once toward each.
    teacher_counts: dict[str, int] = {}
    for td in db.query(TeacherDepartment).all():
        name = dept_map.get(td.department_id, td.department_id)
        teacher_counts[name] = teacher_counts.get(name, 0) + 1

    return AdminOverviewOut(
        departments=len(dept_map),
        hods=db.query(HOD).count(),
        teachers=db.query(Teacher).count(),
        students=db.query(Student).count(),
        dept_teacher_counts=[
            AdminDeptTeacherCount(department=name, teachers=count)
            for name, count in teacher_counts.items()
        ],
    )


@router.get("/students", response_model=list[AdminStudentOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    students = db.query(Student).all()
    dept_map = {d.id: d.name for d in db.query(Department).all()}
    section_map = {s.id: s.label for s in db.query(Section).all()}
    course_code_map = {c.id: c.code for c in db.query(Course).all()}

    courses_by_student: dict[str, list[str]] = defaultdict(list)
    for e in db.query(Enrollment).all():
        code = course_code_map.get(e.course_id)
        if code:
            courses_by_student[e.student_id].append(code)

    return [
        AdminStudentOut(
            id=s.id,
            name=s.name,
            enrollment=s.enrollment or "",
            department=dept_map.get(s.department_id, s.department_id or ""),
            semester=s.sem or 0,
            section=section_map.get(s.section_id, (s.section_id or "").upper()),
            batch=_derive_batch(s),
            photo=s.photo,
            email=s.email,
            phone=s.phone,
            address=s.address,
            guardian_name=s.guardian_name,
            guardian_phone=s.guardian_phone,
            courses_enrolled=courses_by_student.get(s.id, []),
        )
        for s in students
    ]


@router.post("/users", response_model=CreateUserResponse)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    try:
        role_enum = RoleEnum(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    if role_enum not in (RoleEnum.hod, RoleEnum.teacher):
        raise HTTPException(status_code=403, detail="Admins can only create HOD and Teacher accounts")

    default_password = generate_default_password()

    user = User(
        email=payload.email,
        hashed_password=hash_password(default_password),
        role=role_enum,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # default_password is only ever returned here, at creation time —
    # it is never stored in plaintext and never retrievable again after this response
    return CreateUserResponse(
        id=user.id, email=user.email, role=user.role.value,
        default_password=default_password,
    )


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role.value, "must_change_password": u.must_change_password} for u in users]


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # any logged-in user, not admin-only
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.utcnow()  # feeds the password-rotation check at login
    db.commit()
    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "account.password_changed")
    return {"message": "Password updated successfully"}

@router.post("/teachers", response_model=CreateTeacherResponse)
def create_teacher(
    payload: CreateTeacherRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    # Admin creates a bare account only — no department here. A teacher can
    # end up in more than one department, so department membership is each
    # HOD's own call (see POST /api/hod/teachers/{id}/assign), made afterward.
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    default_password = generate_default_password()
    user = User(
        email=payload.email,
        hashed_password=hash_password(default_password),
        role=RoleEnum.teacher,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    teacher = Teacher(
        user_id=user.id,
        name=payload.name,
        specialization=payload.specialization,
        qualification=payload.qualification,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "teacher.create", f"{payload.name} ({payload.email})")

    return CreateTeacherResponse(
        teacher_id=teacher.id, user_id=user.id, email=user.email,
        default_password=default_password,
    )

@router.post("/hods", response_model=CreateHodResponse)
def create_hod(
    payload: CreateHodRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    dept_id = department_slug(payload.department_name)
    if not db.query(Department).filter(Department.id == dept_id).first():
        db.add(Department(id=dept_id, name=payload.department_name, code=dept_id.upper()))
        db.commit()

    default_password = generate_default_password()
    user = User(
        email=payload.email,
        hashed_password=hash_password(default_password),
        role=RoleEnum.hod,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    hod = HOD(
        user_id=user.id, name=payload.name, email=payload.email,
        phone=payload.phone, qualification=payload.qualification,
        experience=payload.experience, department_id=dept_id,
    )
    db.add(hod)
    db.commit()
    db.refresh(hod)

    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "hod.create", f"{payload.name} ({payload.email})")

    return CreateHodResponse(hod_id=hod.id, user_id=user.id, email=user.email, default_password=default_password)

@router.get("/hods", response_model=list[HodListingOut])
def list_hods(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    hods = db.query(HOD).all()
    dept_map = {d.id: d.name for d in db.query(Department).all()}

    return [
        HodListingOut(
            id=f"H{h.id}",
            name=h.name,
            department=dept_map.get(h.department_id, h.department_id),
            email=h.email,
            phone=h.phone,
            qualification=h.qualification,
            experience=h.experience,
            photo=h.photo,
        )
        for h in hods
    ]


@router.patch("/hods/{hod_id}", response_model=HodListingOut)
def update_hod(
    hod_id: int,
    payload: UpdateHodRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    hod = db.query(HOD).filter(HOD.id == hod_id).first()
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")

    if payload.name is not None:
        hod.name = payload.name
    if payload.email is not None:
        hod.email = payload.email
    if payload.phone is not None:
        hod.phone = payload.phone
    if payload.qualification is not None:
        hod.qualification = payload.qualification
    if payload.experience is not None:
        hod.experience = payload.experience
    if payload.department_name is not None:
        dept_id = department_slug(payload.department_name)
        if not db.query(Department).filter(Department.id == dept_id).first():
            db.add(Department(id=dept_id, name=payload.department_name, code=dept_id.upper()))
            db.commit()
        hod.department_id = dept_id

    db.commit()
    db.refresh(hod)

    dept = db.query(Department).filter(Department.id == hod.department_id).first()
    return HodListingOut(
        id=f"H{hod.id}",
        name=hod.name,
        department=dept.name if dept else hod.department_id,
        email=hod.email,
        phone=hod.phone,
        qualification=hod.qualification,
        experience=hod.experience,
        photo=hod.photo,
    )


@router.delete("/hods/{hod_id}")
def delete_hod(
    hod_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    hod = db.query(HOD).filter(HOD.id == hod_id).first()
    if not hod:
        raise HTTPException(status_code=404, detail="HOD not found")

    hod_name = hod.name
    user_id = hod.user_id
    db.delete(hod)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "hod.delete", hod_name)
    return {"deleted": hod_id}

@router.get("/teachers", response_model=list[TeacherListingOut])
def list_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    teachers = db.query(Teacher).all()
    teacher_dept_names = _teacher_department_names(db, [t.id for t in teachers])

    result = []
    for t in teachers:
        course_count = db.query(Course).filter(Course.teacher_id == t.id).count()
        result.append(
            TeacherListingOut(
                id=f"T{t.id}",
                name=t.name,
                departments=teacher_dept_names.get(t.id, []),
                specialization=t.specialization,
                qualification=t.qualification,
                email=t.email,
                phone=t.phone,
                photo=t.photo,
                courses=course_count,
            )
        )
    return result


@router.patch("/teachers/{teacher_id}", response_model=TeacherListingOut)
def update_teacher(
    teacher_id: int,
    payload: UpdateTeacherRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if payload.name is not None:
        teacher.name = payload.name
    if payload.email is not None:
        teacher.email = payload.email
    if payload.phone is not None:
        teacher.phone = payload.phone
    if payload.qualification is not None:
        teacher.qualification = payload.qualification
    if payload.specialization is not None:
        teacher.specialization = payload.specialization

    db.commit()
    db.refresh(teacher)

    dept_names = _teacher_department_names(db, [teacher.id]).get(teacher.id, [])
    course_count = db.query(Course).filter(Course.teacher_id == teacher.id).count()

    return TeacherListingOut(
        id=f"T{teacher.id}",
        name=teacher.name,
        departments=dept_names,
        specialization=teacher.specialization,
        qualification=teacher.qualification,
        email=teacher.email,
        phone=teacher.phone,
        photo=teacher.photo,
        courses=course_count,
    )


@router.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    teacher_name = teacher.name
    user_id = teacher.user_id
    # unassign rather than delete their courses — the courses should survive
    db.query(Course).filter(Course.teacher_id == teacher.id).update({Course.teacher_id: None})
    db.query(TeacherDepartment).filter(TeacherDepartment.teacher_id == teacher.id).delete()
    db.delete(teacher)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    settings = _get_or_create_settings(db)
    _log_action(db, settings, current_user, "teacher.delete", teacher_name)
    return {"deleted": teacher_id}