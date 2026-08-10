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
    totp_secret = Column(String, nullable=True)       # base32 TOTP secret, set on 2FA setup
    totp_enabled = Column(Boolean, nullable=False, default=False)
    password_changed_at = Column(DateTime, nullable=True)  # set on every real password change; null = never tracked (legacy row, skip rotation checks)


class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True)   # "ce", "ee", "me"
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)


class Section(Base):
    __tablename__ = "sections"
    id = Column(String, primary_key=True)   # "d", "m1", "m2"
    label = Column(String, nullable=False)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    name = Column(String, nullable=False)
    title = Column(String)
    email = Column(String)
    phone = Column(String)
    institution = Column(String)
    qualification = Column(String)
    experience = Column(String)
    photo = Column(String)


class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    title = Column(String)
    # No single department_id here on purpose: admin creates a bare teacher
    # account with no department, and each HOD who wants this teacher in
    # their department adds them via the TeacherDepartment join table below —
    # a teacher can end up in more than one department that way.
    specialization = Column(String)
    qualification = Column(String)
    email = Column(String)
    phone = Column(String)
    office = Column(String)
    office_hours = Column(String)
    experience = Column(String)
    photo = Column(String)


class TeacherDepartment(Base):
    """Many-to-many: which department(s) a teacher has been added to.
    Assignment is the HOD's action (adding an existing teacher to their
    department), not the admin's — admin only creates the bare account."""
    __tablename__ = "teacher_departments"
    __table_args__ = (
        UniqueConstraint("teacher_id", "department_id", name="uq_teacher_department"),
    )
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)


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

class TeacherActivity(Base):
    """Per-teacher activity feed shown on the teacher dashboard. Written
    inline by the routers that perform teacher actions (attendance.py,
    teacher.py) — unlike AuditLog, this is always on and scoped to a single
    teacher rather than being an admin-wide, togglable audit trail."""
    __tablename__ = "teacher_activities"
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    icon = Column(String, nullable=False)   # "check" | "award" | "bell" | "file" | "message" — matches frontend's activityIcons map
    title = Column(String, nullable=False)
    desc = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


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
    """Continuous/internal assessment marks for a student in a course.
    Teachers enter and save these (draft only — they have no publish
    endpoint). The HOD reviews the department's marks, can adjust any
    field, and is the one who publishes: same draft/publish lifecycle as
    CourseGrade, and students only ever see published rows."""
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

class CourseGrade(Base):
    """Final letter grade for a student in a course, once the semester ends.
    Separate from InternalMark (which only covers internal/continuous
    assessment) — this represents the consolidated final result a transcript
    would show. Same draft/publish lifecycle as InternalMark: students only
    ever see published rows. Owned by the HOD, not the teacher — final
    results come in from the university exam office as a results sheet,
    unlike internal marks which teachers enter themselves."""
    __tablename__ = "course_grades"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_course_grades_student_course"),
    )
    id = Column(Integer, primary_key=True)
    student_id = Column(String, ForeignKey("students.id"))
    course_id = Column(String, ForeignKey("courses.id"))
    grade = Column(String, nullable=False, default="")   # letter grade, e.g. "A+", "B", "F" — "" means ungraded
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
    attachment_url = Column(String, nullable=True)    # served path, e.g. "/uploads/notices/<file>"
    attachment_name = Column(String, nullable=True)   # original filename, shown to the reader
    attachment_size = Column(Integer, nullable=True)  # bytes, for display only


class EventType(str, enum.Enum):
    exam = "Exam"
    deadline = "Deadline"
    meeting = "Meeting"
    event = "Event"
    holiday = "Holiday"
    result = "Result"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(Integer, primary_key=True)
    department_id = Column(String, ForeignKey("departments.id"))
    title = Column(String, nullable=False)
    type = Column(SqlEnum(EventType), nullable=False, default=EventType.event)
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class SystemSettings(Base):
    """Singleton row (id is always 1) holding institution-wide settings."""
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True)

    institution_name = Column(String, nullable=False, default="")
    academic_year = Column(String, nullable=False, default="")
    current_semester_label = Column(String, nullable=False, default="")
    contact_email = Column(String, nullable=False, default="")

    require_2fa = Column(Boolean, nullable=False, default=False)
    session_timeout_enabled = Column(Boolean, nullable=False, default=True)
    password_rotation_enabled = Column(Boolean, nullable=False, default=False)
    audit_logs_enabled = Column(Boolean, nullable=False, default=True)

    email_notifications = Column(Boolean, nullable=False, default=True)
    sms_alerts = Column(Boolean, nullable=False, default=False)
    weekly_summary = Column(Boolean, nullable=False, default=True)

    auto_backup_enabled = Column(Boolean, nullable=False, default=False)
    last_backup_at = Column(DateTime, nullable=True)

    dark_mode_default = Column(Boolean, nullable=False, default=False)
    compact_tables = Column(Boolean, nullable=False, default=False)


class AuditLog(Base):
    """Written only while SystemSettings.audit_logs_enabled is True."""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_email = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False)       # short machine-ish label, e.g. "hod.create"
    detail = Column(String, nullable=True)         # human-readable one-liner
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)