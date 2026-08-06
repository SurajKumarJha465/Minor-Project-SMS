from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, Boolean, Date, DateTime,
    Enum as SqlEnum, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from api.database import Base
from datetime import datetime
import enum
import re

def department_slug(name: str) -> str:
    """'Computer Engineering' -> 'computer-engineering'"""
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


class RoleEnum(str, enum.Enum):
    admin = "admin"
    hod = "hod"
    teacher = "teacher"
    student = "student"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    pending = "pending"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SqlEnum(RoleEnum), nullable=False)
    must_change_password = Column(Boolean, nullable=False, default=True)


class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True)   # "ce", "ee", "me"
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)


class Section(Base):
    __tablename__ = "sections"
    id = Column(String, primary_key=True)   # "d", "m1", "m2"
    label = Column(String, nullable=False)


class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    title = Column(String)
    department_id = Column(String, ForeignKey("departments.id"))
    specialization = Column(String)
    qualification = Column(String)
    email = Column(String)
    phone = Column(String)
    office = Column(String)
    office_hours = Column(String)
    experience = Column(String)
    photo = Column(String)


class Course(Base):
    __tablename__ = "courses"
    id = Column(String, primary_key=True)   # e.g. "ce-5-d-cs501" — matches frontend's composite scheme exactly
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Integer)
    sem = Column(Integer)
    department_id = Column(String, ForeignKey("departments.id"))
    section_id = Column(String, ForeignKey("sections.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))


class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True)   # this MUST match the folder name in data/enrollment_photos/<id>/
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    enrollment = Column(String, unique=True)  # "CE-2023-001"
    photo = Column(String)
    department_id = Column(String, ForeignKey("departments.id"))
    sem = Column(Integer)
    section_id = Column(String, ForeignKey("sections.id"))
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    guardian_name = Column(String)
    guardian_phone = Column(String)


class Enrollment(Base):
    """Which students are on the roster for which course."""
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True)
    student_id = Column(String, ForeignKey("students.id"))
    course_id = Column(String, ForeignKey("courses.id"))


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", "date", name="uq_attendance_student_course_date"),
    )

    id = Column(Integer, primary_key=True)
    student_id = Column(String, ForeignKey("students.id"))
    course_id = Column(String, ForeignKey("courses.id"))
    date = Column(Date, nullable=False)
    status = Column(SqlEnum(AttendanceStatus), nullable=False)
    similarity = Column(Float, nullable=True)   # populated when marked via face recognition, null if manual
    marked_by = Column(String, nullable=True)   # "ai" or teacher's user id

class HOD(Base):
    __tablename__ = "hods"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    qualification = Column(String)
    experience = Column(String)
    department_id = Column(String, ForeignKey("departments.id"))
    photo = Column(String)

class MarkStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class InternalMark(Base):
    __tablename__ = "internal_marks"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_internal_marks_student_course"),
    )
    id = Column(Integer, primary_key=True)
    student_id = Column(String, ForeignKey("students.id"))
    course_id = Column(String, ForeignKey("courses.id"))
    p_att = Column(Integer, default=0)
    p_lab = Column(Integer, default=0)
    p_exam = Column(Integer, default=0)
    p_viva = Column(Integer, default=0)
    t_att = Column(Integer, default=0)
    t_assign = Column(Integer, default=0)
    t_present = Column(Integer, default=0)
    t_assess = Column(Integer, default=0)
    status = Column(SqlEnum(MarkStatus), nullable=False, default=MarkStatus.draft)

class NoticeType(str, enum.Enum):
    department = "Department"
    semester = "Semester"
    exam = "Exam"
    emergency = "Emergency"


class Notice(Base):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True)
    department_id = Column(String, ForeignKey("departments.id"))
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    type = Column(SqlEnum(NoticeType), nullable=False, default=NoticeType.department)
    audience = Column(String, nullable=False, default="All Semesters")
    pinned = Column(Boolean, nullable=False, default=False)
    author_name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    scheduled_for = Column(DateTime, nullable=True)  # null = published immediately
