import os
from api.database import SessionLocal, engine, Base
from api.models import Department, Section, Course, Student, Enrollment, User, RoleEnum
from api.auth import hash_password

Base.metadata.create_all(bind=engine)

# must exactly match your data/enrollment_photos/<id>/ folder names
STUDENT_IDS = [
    "aashik", "anamika", "ananda", "anjana", "anushka",
    "christina", "dip", "kritika", "lasta", "lokesh", "puspa",
    "roshani", "shushant", "suhana",
]

# rough display names — adjust to real names if you have them, folder id stays the DB primary key either way
DISPLAY_NAMES = {
    "aashik": "Aashik", "anamika": "Anamika", "ananda": "Ananda",
    "anjana": "Anjana", "anushka": "Anushka", "christina": "Christina", "dip": "Dip",
    "kritika": "Kritika", "lasta": "Lasta", "lokesh": "Lokesh",
    "puspa": "Puspa", "roshani": "Roshani", "shushant": "Shushant",
    "suhana": "Suhana",
}

# demo accounts matching the frontend's login.tsx expectations
DEMO_ACCOUNTS = [
    ("admin@ssms.edu", "123456", RoleEnum.admin),
    ("hod@ssms.edu", "123456", RoleEnum.hod),
    ("teacher@ssms.edu", "123456", RoleEnum.teacher),
    ("student@ssms.edu", "123456", RoleEnum.student),
]


def seed():
    db = SessionLocal()
    try:
        # department + section (idempotent — skip if already present)
        if not db.query(Department).filter(Department.id == "ce").first():
            db.add(Department(id="ce", name="Computer Engineering", code="CE"))

        if not db.query(Section).filter(Section.id == "d").first():
            db.add(Section(id="d", label="D"))

        db.commit()

        # one course, composite id matches the frontend's scheme: dept-sem-section-coursecode
        course_id = "ce-5-d-cs501"
        if not db.query(Course).filter(Course.id == course_id).first():
            db.add(Course(
                id=course_id,
                code="CS-501",
                name="Machine Learning",
                credits=4,
                sem=5,
                department_id="ce",
                section_id="d",
                teacher_id=None,  # no teacher row yet — fine, nullable
            ))
            db.commit()

        # students
        for sid in STUDENT_IDS:
            if not db.query(Student).filter(Student.id == sid).first():
                db.add(Student(
                    id=sid,
                    name=DISPLAY_NAMES.get(sid, sid.title()),
                    enrollment=f"CE-2023-{STUDENT_IDS.index(sid) + 1:03d}",
                    photo=None,  # frontend can fall back to a placeholder avatar if this is null
                    department_id="ce",
                    sem=5,
                    section_id="d",
                ))
        db.commit()

        # enroll all students into the one course, so there's a real roster
        for sid in STUDENT_IDS:
            exists = db.query(Enrollment).filter(
                Enrollment.student_id == sid, Enrollment.course_id == course_id
            ).first()
            if not exists:
                db.add(Enrollment(student_id=sid, course_id=course_id))
        db.commit()

        # demo login accounts
        # demo login accounts
        for email, password, role in DEMO_ACCOUNTS:
            if not db.query(User).filter(User.email == email).first():
                db.add(
                    User(
                        email=email,
                        hashed_password=hash_password(password),
                        role=role,
                        must_change_password=False,  # demo accounts
                    )
                )
        db.commit()

        print(f"Seeded {len(STUDENT_IDS)} students, 1 course, {len(STUDENT_IDS)} enrollments, {len(DEMO_ACCOUNTS)} demo accounts.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()