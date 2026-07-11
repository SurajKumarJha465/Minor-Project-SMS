// Mock data for the Student role dashboard.
// Everything a single logged-in student ("Sumit Verma") needs across pages.

export const studentProfile = {
  name: "Sumit Verma",
  firstName: "Sumit",
  avatar: "SV",
  enrollment: "CSE21-014",
  department: "Computer Science & Engineering",
  departmentCode: "CSE",
  semester: 5,
  section: "M1",
  batch: "2021 – 2025",
  email: "sumit.verma@college.edu",
  phone: "+91 98765 43210",
  address: "42, Green Park Avenue, New Delhi, 110016",
  dob: "14 March 2003",
  guardianName: "Rakesh Verma",
  guardianContact: "+91 98111 22334",
  username: "sumit.verma",
  cgpa: 8.6,
};

// Headline numbers for the dashboard quick-stat grid.
export const quickStats = {
  attendance: 92,
  gpa: 8.6,
  coursesEnrolled: 6,
  pendingAssignments: 3,
  completedAssignments: 24,
  upcomingExams: 2,
  unreadNotices: 4,
  semesterProgress: 68,
};

// Enrolled courses for the current semester.
export const courses = [
  { code: "CS301", name: "Database Systems", credits: 4, teacher: "Dr. Anita Sharma", attendance: 94, internal: 42, progress: 72, color: "primary",
    description: "Covers relational database design, normalization, SQL, transactions and indexing strategies.",
    resources: [
      { name: "Unit 1 - ER Modeling.pdf", type: "PDF" },
      { name: "Normalization Slides.pptx", type: "Slides" },
      { name: "Lab Manual.docx", type: "Document" },
    ] },
  { code: "CS302", name: "Computer Networks", credits: 4, teacher: "Rahul Mehta", attendance: 88, internal: 38, progress: 65, color: "info",
    description: "Introduces the OSI/TCP-IP stack, routing, subnetting and network security fundamentals.",
    resources: [
      { name: "TCP-IP Reference.pdf", type: "PDF" },
      { name: "Subnetting Slides.pptx", type: "Slides" },
    ] },
  { code: "CS303", name: "Operating Systems", credits: 3, teacher: "Deepa Menon", attendance: 96, internal: 45, progress: 80, color: "success",
    description: "Process scheduling, memory management, deadlocks and file systems with hands-on simulation labs.",
    resources: [
      { name: "Scheduling Algorithms.pdf", type: "PDF" },
      { name: "Deadlock Case Studies.docx", type: "Document" },
    ] },
  { code: "CS304", name: "Software Engineering", credits: 3, teacher: "Karan Verma", attendance: 90, internal: 40, progress: 58, color: "warning",
    description: "Software development lifecycle, UML modeling, agile practices and testing strategies.",
    resources: [
      { name: "UML Diagrams.pdf", type: "PDF" },
      { name: "Agile Overview Slides.pptx", type: "Slides" },
    ] },
  { code: "CS305", name: "Theory of Computation", credits: 4, teacher: "Priya Nair", attendance: 85, internal: 36, progress: 61, color: "primary",
    description: "Automata theory, formal languages, Turing machines and computability/complexity basics.",
    resources: [
      { name: "Automata Notes.pdf", type: "PDF" },
      { name: "Practice Problems.docx", type: "Document" },
    ] },
  { code: "CS306", name: "Web Technologies", credits: 3, teacher: "Rahul Mehta", attendance: 98, internal: 47, progress: 88, color: "info",
    description: "HTML/CSS/JS fundamentals, REST APIs, and modern front-end framework practices.",
    resources: [
      { name: "REST API Guide.pdf", type: "PDF" },
      { name: "Frontend Slides.pptx", type: "Slides" },
    ] },
];

// Attendance page ----------------------------------------------------------
export const attendanceSummary = {
  overall: 92,
  present: 168,
  absent: 8,
  late: 6,
  leave: 4,
  totalClasses: 186,
};

// Colour-coded calendar for the current month (day -> status).
export const attendanceCalendar = (() => {
  const statuses = ["present", "present", "present", "present", "late", "absent", "leave"];
  const days = [];
  for (let d = 1; d <= 30; d++) {
    const weekday = (d + 2) % 7; // pseudo weekday
    if (weekday === 0 || weekday === 6) {
      days.push({ day: d, status: "weekend" });
    } else {
      days.push({ day: d, status: statuses[(d * 3) % statuses.length] });
    }
  }
  return days;
})();

export const courseWiseAttendance = courses.map((c) => {
  const total = 32;
  const present = Math.round((c.attendance / 100) * total);
  return {
    code: c.code,
    name: c.name,
    teacher: c.teacher,
    percentage: c.attendance,
    present,
    absent: total - present,
    status: c.attendance >= 90 ? "Excellent" : c.attendance >= 75 ? "Good" : "Low",
  };
});

// Assignments page ---------------------------------------------------------
export const pendingAssignments = [
  { id: "A-01", title: "ER Diagram & Normalization", course: "Database Systems", teacher: "Dr. Anita Sharma", due: "12 Jul 2026", priority: "High", status: "Pending", progress: 40 },
  { id: "A-02", title: "TCP/IP Layer Analysis Report", course: "Computer Networks", teacher: "Rahul Mehta", due: "15 Jul 2026", priority: "Medium", status: "In Progress", progress: 65 },
  { id: "A-03", title: "Process Scheduling Simulation", course: "Operating Systems", teacher: "Deepa Menon", due: "18 Jul 2026", priority: "Low", status: "Pending", progress: 10 },
];

export const submittedAssignments = [
  { id: "A-11", title: "SQL Query Optimization", course: "Database Systems", submitted: "28 Jun 2026", marks: 18, total: 20, feedback: "Excellent use of indexing. Watch join order." },
  { id: "A-12", title: "Subnetting Worksheet", course: "Computer Networks", submitted: "24 Jun 2026", marks: 15, total: 20, feedback: "Good, revise VLSM calculations." },
  { id: "A-13", title: "Deadlock Detection Essay", course: "Operating Systems", submitted: "20 Jun 2026", marks: 19, total: 20, feedback: "Very thorough and well structured." },
  { id: "A-14", title: "UML Class Diagrams", course: "Software Engineering", submitted: "16 Jun 2026", marks: 16, total: 20, feedback: "Clear diagrams, add sequence flow." },
];

// Internal marks page ------------------------------------------------------
export const internalMarks = courses.map((c) => {
  const unit = Math.round(c.internal * 0.3);
  const assessment = Math.round(c.internal * 0.25);
  const assignment = Math.round(c.internal * 0.25);
  const attendance = c.internal - unit - assessment - assignment;
  const remark = c.internal >= 45 ? "Outstanding" : c.internal >= 40 ? "Very Good" : "Good";
  const teacherRemark = {
    Outstanding: `Consistently strong performance in ${c.name}. Keep up the excellent work.`,
    "Very Good": `Solid grasp of ${c.name} concepts, with room to push scores higher on assessments.`,
    Good: `Satisfactory progress in ${c.name}; more consistent assignment submissions would help.`,
  }[remark];
  return {
    code: c.code,
    name: c.name,
    teacher: c.teacher,
    unit,
    assessment,
    assignment,
    attendance,
    total: c.internal,
    max: 50,
    remark,
    teacherRemark,
  };
});

// Semester results ---------------------------------------------------------
export const semesterResults = [
  { semester: 1, gpa: 8.1, credits: 24, status: "Published" },
  { semester: 2, gpa: 8.3, credits: 24, status: "Published" },
  { semester: 3, gpa: 8.5, credits: 26, status: "Published" },
  { semester: 4, gpa: 8.8, credits: 26, status: "Published" },
  { semester: 5, gpa: 8.6, credits: 21, status: "In Progress" },
];

const GRADE_POOL = ["A+", "A", "A", "B+", "B+", "B"];
const gradePoint = (g) => ({ "A+": 10, A: 9, "B+": 8, B: 7 })[g] ?? 8;

// Synthetic per-course grade breakdown for each semester, used by the
// "View Result" modal on the Semester Results page.
export const semesterCourseGrades = semesterResults.reduce((acc, s) => {
  const base = s.semester === 5 ? courses : courses.slice(0, 4 + (s.semester % 3));
  acc[s.semester] = base.map((c, i) => {
    const grade = GRADE_POOL[(s.semester + i) % GRADE_POOL.length];
    return { code: c.code, name: c.name, credits: c.credits, grade, gradePoint: gradePoint(grade) };
  });
  return acc;
}, {});

export const semesterGpaTrend = semesterResults.map((s) => ({ name: `Sem ${s.semester}`, gpa: s.gpa }));

// Analytics datasets -------------------------------------------------------
export const attendanceTrend = [
  { name: "Jan", value: 88 },
  { name: "Feb", value: 91 },
  { name: "Mar", value: 87 },
  { name: "Apr", value: 93 },
  { name: "May", value: 90 },
  { name: "Jun", value: 94 },
  { name: "Jul", value: 92 },
];

export const weeklyAttendance = [
  { name: "Mon", value: 100 },
  { name: "Tue", value: 92 },
  { name: "Wed", value: 88 },
  { name: "Thu", value: 96 },
  { name: "Fri", value: 84 },
  { name: "Sat", value: 90 },
];

export const coursePerformance = courses.map((c) => ({
  name: c.code,
  score: Math.round((c.internal / 50) * 100),
}));

export const performanceRadar = courses.map((c) => ({
  subject: c.code,
  score: Math.round((c.internal / 50) * 100),
  fullMark: 100,
}));

export const assignmentCompletion = [
  { name: "Completed", value: 24 },
  { name: "Pending", value: 3 },
  { name: "Overdue", value: 1 },
];

export const marksDistribution = [
  { name: "90-100", value: 2 },
  { name: "80-89", value: 3 },
  { name: "70-79", value: 1 },
  { name: "60-69", value: 0 },
];

export const performanceScore = {
  score: 86,
  rank: 4,
  totalStudents: 62,
  insight:
    "You're performing above your class average. Your attendance and Web Technologies scores are exceptional — focus a little more on Theory of Computation to push your GPA past 9.0.",
  suggestions: [
    "Attend all Theory of Computation lectures — it's your lowest attendance course.",
    "Submit the ER Diagram assignment before the deadline to keep your streak.",
    "Revise subnetting concepts flagged in Computer Networks feedback.",
  ],
};

// Notice board -------------------------------------------------------------
export const notices = [
  { id: "N-01", title: "Semester 5 Mid-Term Exam Schedule Released", category: "Exam", priority: "High", date: "06 Jul 2026", unread: true, attachment: "midterm-schedule.pdf", summary: "Mid-term examinations begin 20 July. Check the detailed datesheet.", description: "The mid-term examination schedule for Semester 5 has been finalized and published. Exams begin 20 July and run through 26 July. Students must carry their admit cards and college ID. Seating arrangements will be posted on the department noticeboard two days prior to the first exam." },
  { id: "N-02", title: "Guest Lecture: AI in Modern Databases", category: "Academic", priority: "Normal", date: "05 Jul 2026", unread: true, attachment: null, summary: "Attend a session by industry expert on 14 July, 11 AM, Seminar Hall.", description: "The CSE department is hosting a guest lecture on \"AI in Modern Databases\" delivered by an industry expert on 14 July at 11 AM in the Seminar Hall. Attendance is optional but highly recommended for students interested in data systems and applied AI." },
  { id: "N-03", title: "CSE Department Hackathon Registration", category: "Department", priority: "Normal", date: "03 Jul 2026", unread: true, attachment: "hackathon.pdf", summary: "Register your team of 3 by 10 July for the annual code sprint.", description: "Registrations are now open for the annual CSE Department Hackathon. Teams of up to 3 students may register by 10 July. The event runs over 24 hours and includes prizes for the top three teams across multiple tracks." },
  { id: "N-04", title: "Library Fine Waiver Week", category: "Important", priority: "High", date: "01 Jul 2026", unread: true, attachment: null, summary: "Return overdue books this week with no late fee.", description: "As part of Library Fine Waiver Week, all overdue books can be returned without incurring any late fee. This applies to books due before 1 July only, and the waiver ends 7 July." },
  { id: "N-05", title: "Fee Payment Deadline Reminder", category: "Important", priority: "High", date: "28 Jun 2026", unread: false, attachment: "fee-notice.pdf", summary: "Semester fee due by 15 July to avoid late charges.", description: "This is a reminder that Semester 5 fees are due by 15 July. A late fee of ₹500 per week will apply after the deadline. Payments can be made online through the student portal or at the accounts office." },
  { id: "N-06", title: "Sports Meet Volunteers Needed", category: "Academic", priority: "Normal", date: "24 Jun 2026", unread: false, attachment: null, summary: "Sign up at the sports office to volunteer for the annual meet.", description: "The annual sports meet requires student volunteers for event coordination, registration desks and logistics support. Interested students can sign up at the sports office before 5 July." },
];

export const noticeCategories = ["All", "Important", "Academic", "Department", "Exam"];

// Academic calendar --------------------------------------------------------
export const calendarEvents = [
  { date: "12 Jul 2026", title: "ER Diagram Assignment Due", type: "assignment" },
  { date: "14 Jul 2026", title: "Guest Lecture — AI in Databases", type: "event" },
  { date: "20 Jul 2026", title: "Mid-Term Exams Begin", type: "exam" },
  { date: "26 Jul 2026", title: "Mid-Term Exams End", type: "exam" },
  { date: "02 Aug 2026", title: "Independence Day Holiday", type: "holiday" },
  { date: "10 Aug 2026", title: "Semester Project Review", type: "event" },
  { date: "28 Aug 2026", title: "Sem 5 Final Exam Registration", type: "exam" },
];

// Recent activity timeline -------------------------------------------------
export const recentActivity = [
  { id: 1, type: "assignment", title: "Assignment Submitted", detail: "SQL Query Optimization · Database Systems", time: "2 hours ago" },
  { id: 2, type: "attendance", title: "Attendance Marked", detail: "Present · Operating Systems", time: "5 hours ago" },
  { id: 3, type: "result", title: "Result Published", detail: "Semester 4 · GPA 8.8", time: "Yesterday" },
  { id: 4, type: "notice", title: "Notice Received", detail: "Mid-Term Exam Schedule Released", time: "Yesterday" },
  { id: 5, type: "feedback", title: "Teacher Feedback", detail: "Dr. Anita Sharma on SQL Query Optimization", time: "2 days ago" },
];

// AI attendance log --------------------------------------------------------
export const aiAttendanceLog = [
  { id: 1, course: "Database Systems", time: "09:02 AM", location: "Room A-204", confidence: 98.4, status: "Recognized" },
  { id: 2, course: "Computer Networks", time: "10:58 AM", location: "Room B-110", confidence: 96.1, status: "Recognized" },
  { id: 3, course: "Operating Systems", time: "12:45 PM", location: "Lab C-3", confidence: 94.7, status: "Recognized" },
  { id: 4, course: "Web Technologies", time: "02:30 PM", location: "Lab C-1", confidence: 97.9, status: "Recognized" },
];
