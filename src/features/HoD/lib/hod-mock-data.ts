export const hod = {
  name: "Dr. Rajendra Prasad",
  title: "Dr.",
  department: "Computer Engineering",
  qualification: "Ph.D. in Distributed Systems, IIT Bombay",
  experience: "18 years",
  email: "hod.compeng@college.edu",
  phone: "+977 98-4444-1122",
  office: "Block B — Room 401 (HOD Chamber)",
  officeHours: "Mon–Fri · 11:00 – 1:00 PM",
  photo: "https://i.pravatar.cc/160?img=52",
  session: "Fall 2026 · AY 2026-27",
  college: "Everest Institute of Technology",
};

export const hodAnalytics = [
  { key: "teachers", label: "Total Teachers", value: 34, delta: "+2 this term", tone: "primary" },
  { key: "students", label: "Total Students", value: 612, delta: "+48 this term", tone: "accent" },
  { key: "courses", label: "Total Courses", value: 42, delta: "8 electives", tone: "info" },
  { key: "semesters", label: "Active Semesters", value: 8, delta: "Sem 1 – 8", tone: "primary" },
  { key: "pendingEnroll", label: "Pending Enrollments", value: 27, delta: "needs review", tone: "warning" },
  { key: "avgAtt", label: "Avg Dept Attendance", value: "86%", delta: "+3%", tone: "success" },
  { key: "gpa", label: "Department GPA", value: "3.42", delta: "/ 4.0", tone: "success" },
  { key: "pendingMarks", label: "Pending Internal Marks", value: 11, delta: "12 courses", tone: "warning" },
  { key: "notices", label: "Unread Notices", value: 4, delta: "posted this week", tone: "accent" },
];

export const teachers = Array.from({ length: 14 }).map((_, i) => ({
  id: `T${100 + i}`,
  name: [
    "Prof. Aarav Sharma", "Dr. Meera Karki", "Prof. Bikash Gurung", "Dr. Sneha Rai",
    "Prof. Rohan Thapa", "Dr. Nisha Adhikari", "Prof. Sujan Lama", "Dr. Manisha KC",
    "Prof. Prabin Sapkota", "Dr. Ritika Joshi", "Prof. Suman Bhattarai", "Dr. Kritika Poudel",
    "Prof. Ashish Magar", "Dr. Pooja Neupane",
  ][i],
  specialization: [
    "Machine Learning", "Databases", "Networks", "Operating Systems",
    "Data Structures", "AI & Robotics", "Compilers", "Cybersecurity",
    "Cloud Computing", "Software Engg.", "Computer Vision", "NLP",
    "IoT & Embedded", "HCI",
  ][i],
  qualification: [
    "Ph.D. in Machine Learning", "Ph.D. in Databases", "M.Tech in Computer Networks", "Ph.D. in Operating Systems",
    "M.Tech in Data Structures & Algorithms", "Ph.D. in Robotics", "M.Tech in Compiler Design", "Ph.D. in Cybersecurity",
    "M.Tech in Cloud Computing", "Ph.D. in Software Engineering", "M.Tech in Computer Vision", "Ph.D. in NLP",
    "M.Tech in IoT & Embedded Systems", "Ph.D. in Human-Computer Interaction",
  ][i],
  experience: `${4 + (i % 12)} years`,
  courses: 2 + (i % 3),
  email: `teacher${i + 1}@college.edu`,
  phone: `+977 98-${1000 + i}-${2000 + i}`,
  status: i % 6 === 0 ? "on-leave" : "active",
  photo: `https://i.pravatar.cc/120?img=${(i * 3 + 12) % 60}`,
}));

export const sections = ["D", "M1", "M2"] as const;
export type Section = (typeof sections)[number];

export const department = "Computer Engineering";

const studentNamePool = [
  "Anisha Karki", "Rohan Thapa", "Priya Rai", "Bikash Gurung", "Sneha Shrestha",
  "Aayush Basnet", "Nisha Adhikari", "Sujan Lama", "Manisha KC", "Prabin Sapkota",
  "Ritika Joshi", "Suman Bhattarai", "Kritika Poudel", "Ashish Magar", "Pooja Neupane",
  "Deepak Tamang", "Rekha Chhetri", "Sagar Pandey", "Muna Bhandari", "Nabin Regmi",
  "Sushmita Dahal", "Bibek Ghimire", "Alina Rana", "Kiran Bista", "Sabina Lamichhane",
  "Yubraj Khadka", "Barsha Ojha", "Pemba Sherpa", "Anjali Thakuri", "Saurav Basyal",
  "Ishani Dhital", "Rabin Shahi", "Sarita Bhusal", "Dinesh Mahato", "Rupa Acharya",
  "Kamal Rijal", "Sarina Maharjan", "Bishal Nepal", "Gita Sunar", "Hari Bahadur",
  "Sita Pariyar", "Ramesh Khatri", "Nirmala Bogati", "Sanjay Chaudhary", "Laxmi Devkota",
  "Milan Shrestha", "Reema Pande", "Ujjwal Koirala", "Sabnam Ale", "Prashant Baral",
  "Kritan Dangol", "Sunita Mainali", "Bishnu Aryal", "Puja Bhatta", "Rajan Karn",
  "Amrit Tiwari", "Sujata Ghale", "Nabaraj Katuwal", "Anita Bohara", "Dipesh Poudyal",
  "Sandhya Ranabhat", "Tenzin Lama",
];

const guardianNamePool = [
  "Ram Karki", "Shyam Thapa", "Hari Rai", "Gopal Gurung", "Krishna Shrestha",
  "Dilip Basnet", "Mohan Adhikari", "Keshav Lama", "Bhim KC", "Deepak Sapkota",
];

const NUM_STUDENTS_PER_SEM_SECTION = 4;

export const hodStudents = Array.from({ length: 8 * sections.length * NUM_STUDENTS_PER_SEM_SECTION }).map((_, i) => {
  const semester = Math.floor(i / (sections.length * NUM_STUDENTS_PER_SEM_SECTION)) + 1;
  const section = sections[Math.floor(i / NUM_STUDENTS_PER_SEM_SECTION) % sections.length];
  const name = studentNamePool[i % studentNamePool.length];
  return {
    id: `S${2000 + i}`,
    name,
    enrollment: `CE-2023-${(i + 1).toString().padStart(3, "0")}`,
    semester,
    section: section as Section,
    department,
    attendance: 65 + ((i * 7) % 33),
    gpa: (2.4 + ((i * 13) % 160) / 100).toFixed(2),
    status: i % 9 === 0 ? "at-risk" : "active",
    photo: `https://i.pravatar.cc/120?img=${(i + 2) % 60}`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@student.college.edu`,
    phone: `+977 98-${3000 + i}-${4000 + i}`,
    address: `Ward ${((i % 12) + 1)}, Kathmandu`,
    guardianName: guardianNamePool[i % guardianNamePool.length],
    guardianPhone: `+977 98-${5000 + i}-${6000 + i}`,
    username: `${name.toLowerCase().replace(/[^a-z]+/g, "")}${2000 + i}`,
    coursesEnrolled: 4 + (i % 3),
  };
});

export function getStudentsBySemesterSection(list: typeof hodStudents, semester: number, section: Section) {
  return list.filter((s) => s.semester === semester && s.section === section);
}

export const hodCourses = [
  { id: "cs101", code: "CS-101", name: "Introduction to Programming", credits: 4, sem: 1, teacher: "Prof. Ashish Magar", enrolled: 80, completion: 90 },
  { id: "cs102", code: "CS-102", name: "Digital Logic Design", credits: 3, sem: 1, teacher: null, enrolled: 80, completion: 0 },
  { id: "cs201", code: "CS-201", name: "Object Oriented Programming", credits: 4, sem: 2, teacher: "Dr. Pooja Neupane", enrolled: 76, completion: 84 },
  { id: "cs202", code: "CS-202", name: "Discrete Mathematics", credits: 3, sem: 2, teacher: null, enrolled: 76, completion: 0 },
  { id: "cs305", code: "CS-305", name: "Database Systems", credits: 3, sem: 3, teacher: "Dr. Sneha Rai", enrolled: 45, completion: 88 },
  { id: "cs306", code: "CS-306", name: "Computer Networks", credits: 3, sem: 3, teacher: "Prof. Suman Bhattarai", enrolled: 74, completion: 66 },
  { id: "cs402", code: "CS-402", name: "Data Structures", credits: 3, sem: 4, teacher: "Prof. Rohan Thapa", enrolled: 61, completion: 78 },
  { id: "cs404", code: "CS-404", name: "Operating Systems", credits: 4, sem: 4, teacher: "Prof. Bikash Gurung", enrolled: 58, completion: 71 },
  { id: "cs501", code: "CS-501", name: "Machine Learning", credits: 4, sem: 5, teacher: "Prof. Aarav Sharma", enrolled: 52, completion: 62 },
  { id: "cs506", code: "CS-506", name: "Cloud Computing", credits: 3, sem: 5, teacher: "Prof. Prabin Sapkota", enrolled: 40, completion: 55 },
  { id: "cs603", code: "CS-603", name: "Advanced Algorithms", credits: 4, sem: 6, teacher: "Dr. Meera Karki", enrolled: 38, completion: 45 },
  { id: "cs604", code: "CS-604", name: "Compiler Design", credits: 3, sem: 6, teacher: "Prof. Sujan Lama", enrolled: 42, completion: 40 },
  { id: "cs702", code: "CS-702", name: "Cybersecurity", credits: 4, sem: 7, teacher: "Dr. Manisha KC", enrolled: 32, completion: 38 },
  { id: "cs703", code: "CS-703", name: "Computer Vision", credits: 3, sem: 7, teacher: null, enrolled: 30, completion: 0 },
  { id: "cs804", code: "CS-804", name: "NLP & Transformers", credits: 4, sem: 8, teacher: "Dr. Kritika Poudel", enrolled: 24, completion: 22 },
  { id: "cs805", code: "CS-805", name: "Major Project", credits: 4, sem: 8, teacher: null, enrolled: 24, completion: 0 },
] as { id: string; code: string; name: string; credits: number; sem: number; teacher: string | null; enrolled: number; completion: number }[];

export function getTeacherByName(name: string | null) {
  if (!name) return undefined;
  return teachers.find((t) => t.name === name);
}

export const semesters = Array.from({ length: 8 }).map((_, i) => {
  const number = i + 1;
  const semCourses = hodCourses.filter((c) => c.sem === number);
  const semStudents = hodStudents.filter((s) => s.semester === number);
  const assignedTeachers = Array.from(
    new Set(semCourses.map((c) => c.teacher).filter((t): t is string => Boolean(t))),
  );
  return {
    id: `sem${number}`,
    number,
    year: "AY 2026-27",
    courses: semCourses.length,
    students: semStudents.length,
    assignedTeachers,
    courseList: semCourses,
    status: i < 5 ? "active" : "upcoming",
  };
});

export const enrollmentRequests = Array.from({ length: 8 }).map((_, i) => ({
  id: `ER${i + 1}`,
  student: hodStudents[i].name,
  enrollment: hodStudents[i].enrollment,
  semester: 5 + (i % 3),
  courses: ["CS-501", "CS-506", i % 2 ? "CS-702" : "CS-603"],
  photo: hodStudents[i].photo,
  status: "pending",
}));

export const deptAttendanceTrend = [
  { week: "W1", ML: 88, DS: 82, ALG: 90, DB: 80, OS: 85 },
  { week: "W2", ML: 91, DS: 85, ALG: 87, DB: 83, OS: 88 },
  { week: "W3", ML: 86, DS: 88, ALG: 92, DB: 79, OS: 84 },
  { week: "W4", ML: 90, DS: 84, ALG: 89, DB: 84, OS: 86 },
  { week: "W5", ML: 93, DS: 87, ALG: 94, DB: 86, OS: 90 },
  { week: "W6", ML: 89, DS: 86, ALG: 91, DB: 83, OS: 88 },
];

export const semesterDistribution = [
  { sem: "Sem 1", students: 84 },
  { sem: "Sem 2", students: 80 },
  { sem: "Sem 3", students: 76 },
  { sem: "Sem 4", students: 78 },
  { sem: "Sem 5", students: 72 },
  { sem: "Sem 6", students: 70 },
  { sem: "Sem 7", students: 82 },
  { sem: "Sem 8", students: 70 },
];

export const teacherWorkload = teachers.slice(0, 8).map((t) => ({
  name: t.name.split(" ").slice(-1)[0],
  courses: t.courses,
  students: 30 + Math.round(t.courses * 18),
}));

export const gpaTrend = [
  { term: "S1'25", gpa: 3.18 },
  { term: "S2'25", gpa: 3.24 },
  { term: "S1'26", gpa: 3.31 },
  { term: "S2'26", gpa: 3.42 },
];

export const passFail = [
  { name: "Pass", value: 88 },
  { name: "Fail", value: 12 },
];

export const hodActivities = [
  { icon: "user", title: "Teacher assigned", desc: "Prof. Prabin Sapkota → CS-506 Cloud Computing", time: "15 min ago", tone: "primary" },
  { icon: "check", title: "Enrollment approved", desc: "Batch of 12 students · Sem 5", time: "1 hr ago", tone: "success" },
  { icon: "book", title: "Course created", desc: "CS-804 · NLP & Transformers (Sem 8)", time: "3 hrs ago", tone: "accent" },
  { icon: "award", title: "Marks published", desc: "CS-603 · Unit Test 2 · Dr. Meera Karki", time: "Yesterday", tone: "warning" },
  { icon: "bell", title: "Department notice posted", desc: "Mid-term exam schedule released", time: "Yesterday", tone: "info" },
  { icon: "clip", title: "Attendance submitted", desc: "CS-402 · 61 students · 84%", time: "2 days ago", tone: "primary" },
];

export const topStudents = hodStudents
  .slice()
  .sort((a, b) => parseFloat(b.gpa) - parseFloat(a.gpa))
  .slice(0, 5);

export const atRiskStudents = hodStudents.filter((s) => s.attendance < 75 || parseFloat(s.gpa) < 2.8).slice(0, 5);

export const departmentNotices = [
  { id: "n1", title: "Mid-term Examination Schedule", type: "Exam", audience: "All Semesters", date: "Jul 10, 2026", author: "HOD Office", pinned: true },
  { id: "n2", title: "Guest Lecture on Transformers by Dr. Aryan", type: "Department", audience: "Sem 5 – 8", date: "Jul 08, 2026", author: "HOD Office" },
  { id: "n3", title: "Sem 6 Project Synopsis Submission", type: "Semester", audience: "Sem 6", date: "Jul 05, 2026", author: "HOD Office" },
  { id: "n4", title: "Network Outage — Lab B-108", type: "Emergency", audience: "All", date: "Jul 03, 2026", author: "IT Cell" },
];

export const calendarEvents = [
  { date: "Jul 10", title: "Mid-term Exams Begin", type: "Exam", color: "warning" },
  { date: "Jul 15", title: "Sem 6 Synopsis Due", type: "Deadline", color: "primary" },
  { date: "Jul 18", title: "Department Faculty Meeting", type: "Meeting", color: "accent" },
  { date: "Jul 22", title: "Guest Lecture — Transformers", type: "Event", color: "info" },
  { date: "Aug 01", title: "Semester Break Begins", type: "Holiday", color: "success" },
  { date: "Aug 12", title: "Result Publication", type: "Result", color: "warning" },
];
