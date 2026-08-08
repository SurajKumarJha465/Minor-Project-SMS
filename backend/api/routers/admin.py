from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import User, RoleEnum, Teacher, Course, HOD, Department, department_slug, Admin, Student
from api.schemas import (
    CreateUserRequest, CreateUserResponse, ChangePasswordRequest,
    CreateTeacherRequest, CreateTeacherResponse,
    CreateHodRequest, CreateHodResponse,
    HodListingOut, UpdateHodRequest,
    TeacherListingOut, UpdateTeacherRequest,
    AdminMeOut, AdminOverviewOut, AdminDeptTeacherCount,
)
from api.auth import (
    hash_password, verify_password, generate_default_password,
    require_role, get_current_user,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

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
    )


@router.get("/overview", response_model=AdminOverviewOut)
def overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    dept_map = {d.id: d.name for d in db.query(Department).all()}

    # Teachers per department, keyed by display name — drives the dashboard's bar chart.
    teacher_counts: dict[str, int] = {}
    for t in db.query(Teacher).all():
        name = dept_map.get(t.department_id, t.department_id)
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
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/teachers", response_model=CreateTeacherResponse)
def create_teacher(
    payload: CreateTeacherRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    dept_id = department_slug(payload.department_name)
    if not db.query(Department).filter(Department.id == dept_id).first():
        db.add(Department(id=dept_id, name=payload.department_name, code=dept_id.upper()))
        db.commit()

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
        department_id=dept_id,
        specialization=payload.specialization,
        qualification=payload.qualification,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    assigned_ids = []
    for c in payload.courses:
        course_id = f"{dept_id}-{payload.semester}-{payload.section_id}-{c.code.lower().replace('-', '')}"
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            course = Course(
                id=course_id, code=c.code, name=c.name, credits=c.credit,
                sem=payload.semester, department_id=dept_id,
                section_id=payload.section_id,
            )
            db.add(course)
        course.teacher_id = teacher.id
        assigned_ids.append(course_id)

    db.commit()

    return CreateTeacherResponse(
        teacher_id=teacher.id, user_id=user.id, email=user.email,
        default_password=default_password, assigned_course_ids=assigned_ids,
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

    user_id = hod.user_id
    db.delete(hod)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    return {"deleted": hod_id}

@router.get("/teachers", response_model=list[TeacherListingOut])
def list_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.admin)),
):
    teachers = db.query(Teacher).all()
    dept_map = {d.id: d.name for d in db.query(Department).all()}

    result = []
    for t in teachers:
        course_count = db.query(Course).filter(Course.teacher_id == t.id).count()
        result.append(
            TeacherListingOut(
                id=f"T{t.id}",
                name=t.name,
                department=dept_map.get(t.department_id, t.department_id),
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

    dept = db.query(Department).filter(Department.id == teacher.department_id).first()
    course_count = db.query(Course).filter(Course.teacher_id == teacher.id).count()

    return TeacherListingOut(
        id=f"T{teacher.id}",
        name=teacher.name,
        department=dept.name if dept else teacher.department_id,
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

    user_id = teacher.user_id
    # unassign rather than delete their courses — the courses should survive
    db.query(Course).filter(Course.teacher_id == teacher.id).update({Course.teacher_id: None})
    db.delete(teacher)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    return {"deleted": teacher_id}