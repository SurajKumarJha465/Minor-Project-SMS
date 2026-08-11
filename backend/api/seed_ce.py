"""
Seed script — Computer Engineering department.

Must run AFTER seed.py (it looks up several already-seeded IT teachers by
name to reuse for shared courses — see SHARED_TEACHER_NAMES below). Re-run
order: `python -m api.seed` then `python -m api.seed_ce`. Both are
idempotent and safe to re-run in either order after the first pass.

Source: BE Computer (Computer Engineering) curriculum published at
https://ncit.edu.np/courses/be-computer, restricted to semesters II/IV/VI
to match the department's only currently-seeded intakes (mirrors the
enrollment-year -> semester mapping used in seed.py):
    2023 intake -> semester 6
    2024 intake -> semester 4
    2025 intake -> semester 2
The published course table has a couple of internal inconsistencies (a
"Data Structure & Algorithms" row duplicated across two semesters, an
"Instrumentation" row duplicated across two semesters, one credit value
of "110" that's clearly a typo for "3") — those duplicates/typos are
resolved by judgement below rather than reproduced literally.

Students are a small invented sample roster (this repo has no real CE
student data source), not a full class list — enough to exercise the
department end-to-end. Teachers, similarly, are invented for CE-only
subjects, following the same title/qualification-invention convention
seed.py already uses for IT.

The interesting part: THREE of these courses are genuinely the same
course as one already seeded for IT (first-year subjects every BE
programme shares) — Algebra and Geometry, Basic Engineering Drawing, and
Object Oriented Programming in C++ at semester II, plus Database
Management System and Microprocessor at semester IV, plus Data
Communication and Elective I at semester VI. Per the task, those reuse
the exact same course `code` AND the same teacher as their IT offering
(just under department_id="ce" instead of "information-technology") —
this is deliberately the scenario the teacher-performance aggregation
fix (see get_course_aggregate_performance) needs to keep separate.
"""
from api.database import SessionLocal, engine, Base
from api.models import (
    Department, Section, Course, Student, Enrollment, User, RoleEnum,
    Teacher, TeacherDepartment, HOD,
)
from api.auth import hash_password
from api.seed import _teacher_email

Base.metadata.create_all(bind=engine)

DEPARTMENT_ID = "ce"
DEPARTMENT_NAME = "Computer Engineering"
DEPARTMENT_CODE = "CE"

SECTION_ID = "d"  # single section — this is a small sample roster, not a full class

DEFAULT_STUDENT_PASSWORD = "student123"
DEFAULT_TEACHER_PASSWORD = "teacher123"
DEFAULT_HOD_PASSWORD = "hod123"

# (enrollment, name, sem, email) — id and enrollment are the same string,
# matching the "CE-2023-001" convention already documented on the Student
# model. Invented sample roster, 8 students per currently-active semester.
CE_STUDENTS = [
    # --- Semester II (2025 intake) ---
    ("CE-2025-001", "Ashmita Koirala", 2, "ashmita.ce25001@ncit.edu.np"),
    ("CE-2025-002", "Bishal Tamang", 2, "bishal.ce25002@ncit.edu.np"),
    ("CE-2025-003", "Chandra Bahadur Karki", 2, "chandra.ce25003@ncit.edu.np"),
    ("CE-2025-004", "Diya Shrestha", 2, "diya.ce25004@ncit.edu.np"),
    ("CE-2025-005", "Kiran Bogati", 2, "kiran.ce25005@ncit.edu.np"),
    ("CE-2025-006", "Manisha Poudel", 2, "manisha.ce25006@ncit.edu.np"),
    ("CE-2025-007", "Nawaraj Bhusal", 2, "nawaraj.ce25007@ncit.edu.np"),
    ("CE-2025-008", "Sristi Lama", 2, "sristi.ce25008@ncit.edu.np"),
    # --- Semester IV (2024 intake) ---
    ("CE-2024-001", "Abiral Neupane", 4, "abiral.ce24001@ncit.edu.np"),
    ("CE-2024-002", "Barsha Adhikari", 4, "barsha.ce24002@ncit.edu.np"),
    ("CE-2024-003", "Deepesh Sunar", 4, "deepesh.ce24003@ncit.edu.np"),
    ("CE-2024-004", "Elina Rana", 4, "elina.ce24004@ncit.edu.np"),
    ("CE-2024-005", "Manoj Gharti", 4, "manoj.ce24005@ncit.edu.np"),
    ("CE-2024-006", "Nikita Bista", 4, "nikita.ce24006@ncit.edu.np"),
    ("CE-2024-007", "Prashant Bhujel", 4, "prashant.ce24007@ncit.edu.np"),
    ("CE-2024-008", "Sabnam Thapa", 4, "sabnam.ce24008@ncit.edu.np"),
    # --- Semester VI (2023 intake) ---
    ("CE-2023-001", "Aaditya Basnyat", 6, "aaditya.ce23001@ncit.edu.np"),
    ("CE-2023-002", "Bibhusha Khatri", 6, "bibhusha.ce23002@ncit.edu.np"),
    ("CE-2023-003", "Dinesh Chhetri", 6, "dinesh.ce23003@ncit.edu.np"),
    ("CE-2023-004", "Kabita Mahat", 6, "kabita.ce23004@ncit.edu.np"),
    ("CE-2023-005", "Milan Rai", 6, "milan.ce23005@ncit.edu.np"),
    ("CE-2023-006", "Puja Gurung", 6, "puja.ce23006@ncit.edu.np"),
    ("CE-2023-007", "Rojan Shahi", 6, "rojan.ce23007@ncit.edu.np"),
    ("CE-2023-008", "Sunayana Bogati", 6, "sunayana.ce23008@ncit.edu.np"),
]

# New CE-only teachers (name, title, specialization, qualification, experience).
# Shared courses below reuse IT_TEACHERS by name instead of appearing here.
CE_TEACHERS = [
    ("Ganesh Prasad Bhattarai", "Er.", "Applied Physics", "M.Sc. in Physics, Tribhuvan University", "10 years"),
    ("Sunita Kafle", "Er.", "Applied Chemistry", "M.Sc. in Chemistry, Tribhuvan University", "8 years"),
    ("Rajendra Bahadur Thapa", "Er.", "Engineering Mathematics", "M.Sc. in Mathematics, Tribhuvan University", "12 years"),
    ("Suman K.C.", "Er.", "Instrumentation & Control", "M.Sc. in Electronics Engineering, Pokhara University", "7 years"),
    ("Anish Bhandari", "Er.", "Programming Technology", "M.Sc. in Computer Engineering, Pokhara University", "6 years"),
    ("Nabin Lamichhane", "Er.", "Embedded Systems", "M.Sc. in Computer Engineering, Pokhara University", "9 years"),
    ("Sujata Poudel", "Er.", "Software Engineering", "M.Sc. in Software Engineering, Pokhara University", "8 years"),
    ("Bikash Thapa Magar", "Er.", "Simulation & Modelling", "M.Sc. in Computer Engineering, Pokhara University", "7 years"),
]

# Names of already-seeded IT teachers reused here for genuinely shared
# courses — kept as a set so the course-loop below knows to look these up
# instead of treating them as new CE teachers.
SHARED_TEACHER_NAMES = {
    "Purna Pd Sharma",     # Algebra and Geometry (this is the IT "d" section's teacher; picked as the one CE offering's teacher)
    "Bibek Pudashaini",    # Basic Engineering Drawing
    "Nirdsoh Adhikari",    # OOP in C++
    "Manil Vaidhya",       # Database Management System
    "Mahesh Neupane",      # Microprocessor and Computer Architecture
    "Himal Acharya",       # Data Communication
}

# (code, name, sem, credits, teacher_name_or_None, is_shared)
# Shared rows deliberately reuse the exact code + teacher of their IT
# counterpart (see COURSE_TEMPLATES in seed.py) so the same course shows
# up correctly under two departments instead of being two unrelated rows
# that happen to share a name.
CE_COURSE_TEMPLATES = [
    # --- Semester II --- (IT counterparts: MTH 116, MEC 115, CMP 117)
    ("MTH 116", "Algebra and Geometry", 2, 3, "Purna Pd Sharma", True),
    ("MEC 115", "Basic Engineering Drawing", 2, 1, "Bibek Pudashaini", True),
    ("CMP 117", "Object Oriented Programming in C++", 2, 3, "Nirdsoh Adhikari", True),
    ("PHY 110", "Applied Physics", 2, 3, "Ganesh Prasad Bhattarai", False),
    ("CHM 110", "Applied Chemistry", 2, 2, "Sunita Kafle", False),
    # --- Semester IV --- (IT counterparts: CMP 215, ELX 213)
    ("CMP 215", "Database Management System", 4, 3, "Manil Vaidhya", True),
    ("ELX 213", "Microprocessor and Computer Architecture", 4, 3, "Mahesh Neupane", True),
    ("MTH 218", "Engineering Mathematics IV", 4, 3, "Rajendra Bahadur Thapa", False),
    ("ELX 220", "Instrumentation", 4, 3, "Suman K.C.", False),
    ("CMP 219", "Programming Technology", 4, 3, "Anish Bhandari", False),
    ("CMP 291", "Project I", 4, 1, None, False),
    # --- Semester VI --- (IT counterparts: CMP 312, CT 316)
    ("CMP 312", "Data Communication", 6, 3, "Himal Acharya", True),
    ("CT 316", "Elective I", 6, 3, None, True),
    ("ELX 320", "Embedded Systems", 6, 3, "Nabin Lamichhane", False),
    ("COM 615", "Object Oriented Software Engineering", 6, 3, "Sujata Poudel", False),
    ("CMP 392", "Project II", 6, 2, None, False),
    ("CMP 351", "Simulation and Modelling", 6, 3, "Bikash Thapa Magar", False),
]

HOD_EMAIL = "hod.ce@ncit.edu.np"
HOD_PROFILE = dict(
    name="Dr. Ramesh Kumar Sah",
    qualification="Ph.D. in Computer Engineering, Pokhara University",
    experience="15 years",
    phone="+977 98-5100-3300",
    office="CE Block — Room 401 (HOD Chamber)",
)


def seed_ce():
    db = SessionLocal()
    try:
        # --- department + section ---
        if not db.query(Department).filter(Department.id == DEPARTMENT_ID).first():
            db.add(Department(id=DEPARTMENT_ID, name=DEPARTMENT_NAME, code=DEPARTMENT_CODE))
        if not db.query(Section).filter(Section.id == SECTION_ID).first():
            db.add(Section(id=SECTION_ID, label="Day"))
        db.commit()

        # --- students + their login accounts ---
        created_students = 0
        for enrollment, name, sem, email in CE_STUDENTS:
            if db.query(Student).filter(Student.id == enrollment).first():
                continue  # already seeded, idempotent re-run

            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=hash_password(DEFAULT_STUDENT_PASSWORD),
                    role=RoleEnum.student,
                    must_change_password=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            db.add(Student(
                id=enrollment,
                user_id=user.id,
                name=name,
                enrollment=enrollment,
                photo=None,
                department_id=DEPARTMENT_ID,
                sem=sem,
                section_id=SECTION_ID,
                email=email,
            ))
            created_students += 1
        db.commit()

        # --- new CE-only teachers + their login accounts ---
        teacher_id_by_name: dict[str, int] = {}
        for name, title, specialization, qualification, experience in CE_TEACHERS:
            existing = db.query(Teacher).filter(Teacher.name == name).first()
            if existing:
                teacher_id_by_name[name] = existing.id
            else:
                email = _teacher_email(name)
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(
                        email=email, hashed_password=hash_password(DEFAULT_TEACHER_PASSWORD),
                        role=RoleEnum.teacher, must_change_password=True,
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)

                teacher = Teacher(
                    user_id=user.id, name=name, title=title,
                    specialization=specialization, qualification=qualification,
                    email=user.email, phone=f"+977 98-{4300 + len(teacher_id_by_name)}-{6400 + len(teacher_id_by_name)}",
                    office=f"CE Block — Room {301 + len(teacher_id_by_name)}",
                    office_hours=f"Sun–Thu · {1 + (len(teacher_id_by_name) % 4)}:00 – {3 + (len(teacher_id_by_name) % 4)}:00 PM",
                    experience=experience,
                    photo=f"https://i.pravatar.cc/160?img={(len(teacher_id_by_name) * 7 + 23) % 70}",
                )
                db.add(teacher)
                db.commit()
                db.refresh(teacher)
                teacher_id_by_name[name] = teacher.id

            if not db.query(TeacherDepartment).filter(
                TeacherDepartment.teacher_id == teacher_id_by_name[name],
                TeacherDepartment.department_id == DEPARTMENT_ID,
            ).first():
                db.add(TeacherDepartment(teacher_id=teacher_id_by_name[name], department_id=DEPARTMENT_ID))
        db.commit()

        # --- shared teachers: already exist from seed.py (IT), just look
        # them up by name and give them a TeacherDepartment row for CE too,
        # so they show up in this department's teacher list/filters as well ---
        for name in SHARED_TEACHER_NAMES:
            teacher = db.query(Teacher).filter(Teacher.name == name).first()
            if not teacher:
                raise RuntimeError(
                    f"Shared teacher {name!r} not found — run seed.py before seed_ce.py"
                )
            teacher_id_by_name[name] = teacher.id
            if not db.query(TeacherDepartment).filter(
                TeacherDepartment.teacher_id == teacher.id,
                TeacherDepartment.department_id == DEPARTMENT_ID,
            ).first():
                db.add(TeacherDepartment(teacher_id=teacher.id, department_id=DEPARTMENT_ID))
        db.commit()

        # --- courses (single section each — see SECTION_ID note above) ---
        created_courses = 0
        enrollment_count = 0
        for code, name, sem, credits, teacher_name, is_shared in CE_COURSE_TEMPLATES:
            code_slug = code.lower().replace(" ", "").replace("-", "")
            course_id = f"{DEPARTMENT_ID}-{sem}-{SECTION_ID}-{code_slug}"
            teacher_id = teacher_id_by_name.get(teacher_name) if teacher_name else None

            course = db.query(Course).filter(Course.id == course_id).first()
            if not course:
                course = Course(
                    id=course_id, code=code, name=name, credits=credits,
                    sem=sem, department_id=DEPARTMENT_ID, section_id=SECTION_ID,
                    teacher_id=teacher_id,
                )
                db.add(course)
                db.commit()
                created_courses += 1
            elif course.teacher_id != teacher_id:
                course.teacher_id = teacher_id
                db.commit()

            roster = db.query(Student).filter(
                Student.department_id == DEPARTMENT_ID,
                Student.sem == sem,
                Student.section_id == SECTION_ID,
            ).all()
            for s in roster:
                exists = db.query(Enrollment).filter(
                    Enrollment.student_id == s.id, Enrollment.course_id == course_id
                ).first()
                if not exists:
                    db.add(Enrollment(student_id=s.id, course_id=course_id))
                    enrollment_count += 1
        db.commit()

        # --- HOD profile ---
        hod_user = db.query(User).filter(User.email == HOD_EMAIL).first()
        if not hod_user:
            hod_user = User(
                email=HOD_EMAIL, hashed_password=hash_password(DEFAULT_HOD_PASSWORD),
                role=RoleEnum.hod, must_change_password=True,
            )
            db.add(hod_user)
            db.commit()
            db.refresh(hod_user)
        if not db.query(HOD).filter(HOD.user_id == hod_user.id).first():
            db.add(HOD(
                user_id=hod_user.id, name=HOD_PROFILE["name"], email=hod_user.email,
                phone=HOD_PROFILE["phone"], qualification=HOD_PROFILE["qualification"],
                experience=HOD_PROFILE["experience"], department_id=DEPARTMENT_ID,
            ))
            db.commit()

        shared_count = sum(1 for *_rest, is_shared in CE_COURSE_TEMPLATES if is_shared)
        print(f"Seeded {created_students} CE students, {len(CE_TEACHERS)} new CE teachers "
              f"({len(SHARED_TEACHER_NAMES)} shared with IT), {created_courses} courses "
              f"({shared_count} shared with IT), {enrollment_count} enrollments, 1 HOD profile.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_ce()