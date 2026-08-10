from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentOut(BaseModel):
    id: str
    name: str
    enrollment: str
    photo: Optional[str] = None
    attendance: int = 0     # placeholder until real attendance % calculation is added (Phase 2)
    internal: int = 0       # placeholder until marks module exists (Phase 2)
    status: str = "present" # default; real per-day status comes from AttendanceRecord, not this endpoint

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: str          # composite id, e.g. "ce-5-d-cs501" — matches frontend's scheme
    code: str
    name: str
    credits: int
    sem: int
    dept: str        # raw department id, e.g. "ce" — frontend calls .toUpperCase() on this itself
    enrolled: int

    class Config:
        from_attributes = True


class RecognizedFace(BaseModel):
    student_id: str
    similarity: float


class RecognizeResponse(BaseModel):
    recognized: list[RecognizedFace]


class SaveAttendanceResponse(BaseModel):
    saved: int

class CreateUserRequest(BaseModel):
    email: str
    role: str  # "admin" | "hod" | "teacher" | "student"


class CreateUserResponse(BaseModel):
    id: int
    email: str
    role: str
    default_password: str  # shown once, at creation time only


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class StudentMeOut(BaseModel):
    id: str
    name: str
    enrollment: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    department: str
    section: str
    semester: int
    batch: str             # derived from the enrollment year encoded in the id, e.g. "2023-2027"
    photo: Optional[str] = None
    username: str
    must_change_password: bool
    two_factor_enabled: bool

    class Config:
        from_attributes = True


class UpdateMyProfileRequest(BaseModel):
    # Deliberately excludes email, enrollment, department, semester and
    # section — those are administrative fields a student cannot self-edit.
    phone: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class TwoFactorVerifyRequest(BaseModel):
    code: str


class TwoFactorStatusResponse(BaseModel):
    enabled: bool


class CreateTeacherRequest(BaseModel):
    name: str
    email: str
    phone: str
    qualification: str
    specialization: str


class CreateTeacherResponse(BaseModel):
    teacher_id: int
    user_id: int
    email: str
    default_password: str

class TeacherListingOut(BaseModel):
    id: str
    name: str
    departments: list[str] = []
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    email: str
    phone: Optional[str] = None
    photo: Optional[str] = None
    courses: int = 0

    class Config:
        from_attributes = True


class UpdateTeacherRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None

class CreateHodRequest(BaseModel):
    name: str
    email: str
    phone: str
    qualification: str
    experience: str
    department_name: str


class CreateHodResponse(BaseModel):
    hod_id: int
    user_id: int
    email: str
    default_password: str

class HodListingOut(BaseModel):
    id: str
    name: str
    department: str
    email: str
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    photo: Optional[str] = None

    class Config:
        from_attributes = True


class UpdateHodContactRequest(BaseModel):
    """Self-service contact edit for the HOD's own profile — deliberately
    narrower than UpdateHodRequest (which is for the admin editing a HOD's
    full record, including name/department)."""
    email: Optional[str] = None
    phone: Optional[str] = None


class UpdateHodRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    department_name: Optional[str] = None

class UpdateAdminProfileRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    institution: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    photo: Optional[str] = None


class AdminMeOut(BaseModel):
    name: str
    title: Optional[str] = None
    email: str
    phone: Optional[str] = None
    institution: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    photo: Optional[str] = None
    must_change_password: bool = False
    two_factor_enabled: bool = False

    class Config:
        from_attributes = True


class AdminDeptTeacherCount(BaseModel):
    department: str
    teachers: int


class SearchResultOut(BaseModel):
    type: str  # e.g. "student" | "teacher" | "hod" | "course"
    id: str
    name: str
    subtitle: str  # e.g. department, enrollment, or email
    photo: Optional[str] = None
    sem: Optional[int] = None
    section: Optional[str] = None
    meta: Optional[str] = None  # extra routing context, e.g. a related course id


class AdminOverviewOut(BaseModel):
    departments: int
    hods: int
    teachers: int
    students: int
    dept_teacher_counts: list[AdminDeptTeacherCount]


class AdminStudentOut(BaseModel):
    id: str
    name: str
    enrollment: str
    department: str
    semester: int
    section: str
    batch: str
    photo: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    courses_enrolled: list[str] = []

    class Config:
        from_attributes = True

class CreateStudentRequest(BaseModel):
    name: str
    enrollment: str
    semester: int
    section: str  # e.g. "D" — normalized server-side
    email: str
    phone: str
    address: str
    guardian_name: str
    guardian_phone: str


class CreateStudentResponse(BaseModel):
    student_id: str
    user_id: int
    email: str
    default_password: str


class HodStudentOut(BaseModel):
    id: str
    name: str
    enrollment: str
    semester: int
    section: str          # section label, e.g. "D"
    department: str       # department display name, e.g. "Computer Engineering"
    photo: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    courses_enrolled: int = 0   # real count from Enrollment, not a placeholder
    attendance_pct: float = 0.0   # % of present/absent-marked AttendanceRecord rows that are "present"; 0.0 if none recorded yet
    gpa: float = 0.0              # credit-weighted average over published CourseGrade rows; 0.0 if none published yet

    class Config:
        from_attributes = True

class UpdateStudentRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class AttendanceTodayItem(BaseModel):
    student_id: str
    status: str
    similarity: Optional[float] = None
    marked_by: Optional[str] = None

class AttendanceTodayResponse(BaseModel):
    course_id: str
    date: str
    records: list[AttendanceTodayItem]

class StudentCourseOut(BaseModel):
    id: str
    code: str
    name: str
    credits: int
    teacher: str
    attendance: float          # percentage, same calc as /api/student/attendance
    internal: int              # published total only; 0 if not yet published
    internal_max: int = 50

class StudentCourseAttendanceOut(BaseModel):
    course_id: str
    code: str
    name: str
    teacher: str
    present: int
    absent: int
    total: int
    percentage: float
    status: str  # "Excellent" | "Good" | "Warning"

class StudentAttendanceDay(BaseModel):
    date: str        # ISO date, e.g. "2026-08-05"
    status: str       # "present" | "absent" — day is "present" if present in >=1 class that day

class StudentAttendanceSummary(BaseModel):
    overall: float
    total_classes: int
    present: int
    absent: int

class StudentAttendanceResponse(BaseModel):
    summary: StudentAttendanceSummary
    courses: list[StudentCourseAttendanceOut]
    calendar: list[StudentAttendanceDay]

class HodCourseOut(BaseModel):
    id: str
    code: str
    name: str
    credits: int
    sem: int
    section: str                      # section label, e.g. "D"
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    enrolled: int = 0

    class Config:
        from_attributes = True


class CreateCourseRequest(BaseModel):
    code: str
    name: str
    credits: int
    sem: int
    section: str = "D"


class UpdateCourseRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[int] = None
    section: Optional[str] = None
    teacher_id: Optional[int] = None
    unassign_teacher: bool = False    # explicit flag, since `teacher_id: None` is indistinguishable from "not provided"


class HodTeacherOut(BaseModel):
    id: int
    name: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    courses: int = 0

    class Config:
        from_attributes = True


class HodAvailableTeacherOut(BaseModel):
    """A teacher not yet in this HOD's department, shown when searching to add one."""
    id: int
    name: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    email: Optional[str] = None
    photo: Optional[str] = None
    departments: list[str] = []  # other departments this teacher is already in, for context

    class Config:
        from_attributes = True

class HodCourseRosterStudent(BaseModel):
    id: str
    name: str
    enrollment: str
    semester: int
    section: str
    photo: Optional[str] = None
    enrolled: bool

    class Config:
        from_attributes = True


class EnrollStudentRequest(BaseModel):
    student_id: str

FIELD_MAX = {
    "p_att": 2, "p_lab": 4, "p_exam": 8, "p_viva": 6,
    "t_att": 3, "t_assign": 6, "t_present": 3, "t_assess": 18,
}


class MarkFields(BaseModel):
    p_att: int = 0
    p_lab: int = 0
    p_exam: int = 0
    p_viva: int = 0
    t_att: int = 0
    t_assign: int = 0
    t_present: int = 0
    t_assess: int = 0


class StudentMarkRow(MarkFields):
    student_id: str
    name: str
    enrollment: str
    status: str = "draft"

    class Config:
        from_attributes = True


class StudentInternalMarkRow(MarkFields):
    """Per-component internal marks breakdown as the student sees it — same
    fields the HOD publishes, plus the computed total and published/pending
    status. See GET /api/student/internal-marks."""
    course_id: str
    code: str
    name: str
    teacher: str
    total: int
    max: int = 50
    status: str  # "published" | "pending"


class SaveMarksRow(MarkFields):
    student_id: str


class SaveMarksRequest(BaseModel):
    rows: list[SaveMarksRow]


class TeacherPerformanceStudentRow(BaseModel):
    student_id: str
    name: str
    enrollment: str
    attendance_pct: float   # real % from AttendanceRecord (present / marked, excludes "pending")
    marks_total: int        # real sum of InternalMark fields, out of TOTAL_MARKS


class TeacherCoursePerformanceOut(BaseModel):
    course_id: str
    code: str
    name: str
    credits: int
    enrolled: int
    avg_attendance: float
    avg_marks: float
    total_marks: int        # denominator for marks_total, currently 50
    students: list[TeacherPerformanceStudentRow]


class TeacherCourseOfferingSummary(BaseModel):
    """One (sem, section) offering of a course, with its own summary stats —
    used for the section-picker shown under the aggregate view."""
    id: str          # composite course id, e.g. "ce-5-d-cs501"
    sem: int
    section: str
    enrolled: int
    avg_attendance: float
    avg_marks: float


class TeacherCourseAggregatePerformanceOut(BaseModel):
    """Combined performance across every section/semester offering of a
    course code the teacher is assigned to. Shown before drilling into a
    single offering's TeacherCoursePerformanceOut dashboard."""
    code: str
    name: str
    credits: int
    enrolled: int
    avg_attendance: float
    avg_marks: float
    total_marks: int
    students: list[TeacherPerformanceStudentRow]
    offerings: list[TeacherCourseOfferingSummary]


class HodGradeRow(BaseModel):
    student_id: str
    name: str
    enrollment: str
    grade: str = ""
    status: str = "draft"

    class Config:
        from_attributes = True


class SaveGradesRow(BaseModel):
    student_id: str
    grade: str


class SaveGradesRequest(BaseModel):
    rows: list[SaveGradesRow]


class SemesterResultImportSkip(BaseModel):
    enrollment: str
    course_code: str
    reason: str


class SemesterResultImportResponse(BaseModel):
    saved: int
    skipped: list[SemesterResultImportSkip]


class HodSemesterCourseSummary(BaseModel):
    course_id: str
    code: str
    name: str
    section: str
    graded: int            # rows with a non-empty grade recorded
    total_enrolled: int
    published: bool        # true once every graded row for this course is published


class HodSemesterResultsSummary(BaseModel):
    semester: int
    courses: list[HodSemesterCourseSummary]


class StudentSemesterCourseOut(BaseModel):
    code: str
    name: str
    credits: int
    grade: str
    grade_point: float


class StudentSemesterResultOut(BaseModel):
    semester: int
    credits: int
    gpa: float           # this is the SGPA for that one semester
    status: str           # "Published" | "Pending" — Published only once every graded course that semester is published


class StudentResultsResponse(BaseModel):
    cgpa: float            # cumulative, weighted across all published semesters
    results: list[StudentSemesterResultOut]
    courses_by_semester: dict[int, list[StudentSemesterCourseOut]]

class HodMarkDistributionBucket(BaseModel):
    range: str
    count: int


class HodCourseAverage(BaseModel):
    code: str
    name: str
    avg: float


class HodTeacherMarkStatus(BaseModel):
    teacher_id: int
    name: str
    courses: int
    entered: int
    pending: int


class HodMarksOverview(BaseModel):
    avg: float
    highest: float
    highest_student: Optional[str] = None
    lowest: float
    lowest_student: Optional[str] = None
    pending_courses: int
    total_courses: int
    course_averages: list[HodCourseAverage]
    distribution: list[HodMarkDistributionBucket]
    teacher_status: list[HodTeacherMarkStatus]


class HodCoursePassFail(BaseModel):
    code: str
    passed: int
    failed: int


class HodRankedStudent(BaseModel):
    id: str
    name: str
    enrollment: str
    semester: int
    photo: Optional[str] = None
    percentage: float


class HodResultsOverview(BaseModel):
    avg_percentage: float
    pass_percentage: float
    fail_percentage: float
    pass_fail_by_course: list[HodCoursePassFail]
    top_students: list[HodRankedStudent]
    at_risk_students: list[HodRankedStudent]


class HodCourseAttendance(BaseModel):
    code: str
    name: str
    pct: float


class HodTeacherAttendance(BaseModel):
    teacher_id: int
    name: str
    pct: float


class HodLowAttendanceStudent(BaseModel):
    id: str
    name: str
    enrollment: str
    semester: int
    pct: float


class HodAttendanceReport(BaseModel):
    overall_pct: float
    total_records: int   # count of present/absent AttendanceRecord rows factored in (pending excluded)
    by_course: list[HodCourseAttendance]
    by_teacher: list[HodTeacherAttendance]
    low_attendance_students: list[HodLowAttendanceStudent]   # below LOW_ATTENDANCE_THRESHOLD_PCT, worst first

class NoticeOut(BaseModel):
    id: int
    title: str
    body: str
    type: str
    audience: str
    pinned: bool
    author: str
    date: str
    scheduled_for: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None

    class Config:
        from_attributes = True


class NoticeAttachmentOut(BaseModel):
    attachment_url: str
    attachment_name: str
    attachment_size: int


class CreateNoticeRequest(BaseModel):
    title: str
    body: str
    type: str = "Department"
    audience: str = "All Semesters"
    pinned: bool = False
    scheduled_for: Optional[datetime] = None
    attachment_url: Optional[str] = None    # from a prior POST /notices/attachment upload
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None


class UpdateNoticeRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    type: Optional[str] = None
    audience: Optional[str] = None
    pinned: Optional[bool] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None
    remove_attachment: bool = False   # explicit clear, since omitted attachment_* just means "don't touch it"

class TwoFactorLoginRequest(BaseModel):
    pending_token: str
    code: str

class EventOut(BaseModel):
    id: int
    title: str
    type: str
    date: str          # ISO 8601, e.g. "2026-08-15T00:00:00"
    display_date: str  # e.g. "Aug 15, 2026"

    class Config:
        from_attributes = True


class CreateEventRequest(BaseModel):
    title: str
    type: str = "Event"
    date: datetime


class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[datetime] = None


class SettingsOut(BaseModel):
    institution_name: str
    academic_year: str
    current_semester_label: str
    contact_email: str
    require_2fa: bool
    session_timeout_enabled: bool
    password_rotation_enabled: bool
    audit_logs_enabled: bool
    email_notifications: bool
    sms_alerts: bool
    weekly_summary: bool
    auto_backup_enabled: bool
    last_backup_at: Optional[datetime] = None
    dark_mode_default: bool
    compact_tables: bool

    class Config:
        from_attributes = True


class UpdateSettingsRequest(BaseModel):
    institution_name: Optional[str] = None
    academic_year: Optional[str] = None
    current_semester_label: Optional[str] = None
    contact_email: Optional[str] = None
    require_2fa: Optional[bool] = None
    session_timeout_enabled: Optional[bool] = None
    password_rotation_enabled: Optional[bool] = None
    audit_logs_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    sms_alerts: Optional[bool] = None
    weekly_summary: Optional[bool] = None
    auto_backup_enabled: Optional[bool] = None
    dark_mode_default: Optional[bool] = None
    compact_tables: Optional[bool] = None


class BackupTriggerResponse(BaseModel):
    last_backup_at: datetime


class SystemInfoOut(BaseModel):
    version: str
    environment: str
    database: str
    uptime_seconds: int


class AuditLogOut(BaseModel):
    id: int
    actor_email: str
    actor_role: str
    action: str
    detail: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherMeOut(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    office_hours: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[str] = None
    photo: Optional[str] = None
    username: str                    # login email's local part, e.g. "aarav.sharma" — mirrors StudentMeOut's pattern
    must_change_password: bool
    two_factor_enabled: bool

    class Config:
        from_attributes = True


class UpdateTeacherContactRequest(BaseModel):
    # Deliberately excludes name — stays admin-managed, same as HOD/Student records.
    email: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    office_hours: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None


class TeacherActivityOut(BaseModel):
    icon: str
    title: str
    desc: str
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherDepartmentOut(BaseModel):
    id: str
    name: str
    code: str

    class Config:
        from_attributes = True