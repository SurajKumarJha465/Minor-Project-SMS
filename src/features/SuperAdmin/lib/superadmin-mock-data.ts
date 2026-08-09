export const superAdmin = {
  name: "Aarati Bhandari",
  title: "",
  role: "Super Administrator",
  email: "superadmin@college.edu",
  phone: "+977 98-0000-1010",
  photo: "https://i.pravatar.cc/160?img=47",
  lastLogin: "Today · 09:14 AM · Kathmandu",
  security: "2FA Enabled · Strong password",
  college: "Everest Institute of Technology",
  session: "Fall 2026 · AY 2026-27",
  currentSemester: "Semester 5 (Ongoing)",
};

export const saAnalytics = [
  { key: "departments", label: "Total Departments", value: 8, delta: "+1 this year", tone: "primary" },
  { key: "hods", label: "Total HODs", value: 8, delta: "1 vacancy", tone: "accent" },
  { key: "teachers", label: "Total Teachers", value: 214, delta: "+12 this term", tone: "info" },
  { key: "students", label: "Total Students", value: 4820, delta: "+310 this year", tone: "primary" },
  { key: "semesters", label: "Total Semesters", value: 8, delta: "Sem 1 – 8", tone: "success" },
];

// ---------------------------------------------------------------------------
// Real NCIT departments (https://ncit.edu.np/), used everywhere the admin
// portal needs a department picker: Create HOD, Create Teacher, and the
// Student Management drill-down (department -> semester -> students).
// "Information Technology" (site's "IT Engineering") is listed first since
// it's our own seeded department with real data.
// ---------------------------------------------------------------------------
export const departmentList = [
  "Information Technology",
  "Computer Engineering",
  "Software Engineering",
  "Information and Communication Engineering",
  "Civil Engineering",
  "Architecture",
  "BCA",
  "BBA",
  "Graduate Studies",
] as const;

export const hodDepartmentOptions = departmentList;

const depts = departmentList;

export const hods = depts.map((d, i) => ({
  id: `H${100 + i}`,
  name: [
    "Dr. Rajendra Prasad", "Dr. Sunita Rana", "Dr. Bikash Adhikari", "Dr. Manisha Karki",
    "Dr. Ramesh Shrestha", "Dr. Prakash Thapa", "Dr. Anita Sharma", "Dr. Kabita Gurung", "Dr. Sudarshan Karki",
  ][i],
  department: d,
  email: `hod.${d.split(" ")[0].toLowerCase()}@college.edu`,
  phone: `+977 98-11${(10 + i).toString()}-22${(10 + i).toString()}`,
  status: i === 5 ? "on-leave" : "active",
  qualification: ["Ph.D. Computer Engineering", "Ph.D. Electronics", "Ph.D. Software Engineering", "Ph.D. Architecture", "Ph.D. Civil Engineering", "Ph.D. Computer Applications", "Ph.D. Management", "Ph.D. Comm. Engineering", "Ph.D. Information Technology"][i],
  experience: `${8 + i} years`,
  assignedSince: ["Aug 2019", "Jan 2020", "Jul 2021", "Mar 2022", "Sep 2020", "Feb 2023", "Nov 2018", "Apr 2024", "Jun 2021"][i],
  photo: `https://i.pravatar.cc/120?img=${(i * 5 + 20) % 60}`,
}));

export const saTeachers = Array.from({ length: 18 }).map((_, i) => ({
  id: `T${200 + i}`,
  name: [
    "Prof. Aarav Sharma", "Dr. Meera Karki", "Prof. Bikash Gurung", "Dr. Sneha Rai",
    "Prof. Rohan Thapa", "Dr. Nisha Adhikari", "Prof. Sujan Lama", "Dr. Manisha KC",
    "Prof. Prabin Sapkota", "Dr. Ritika Joshi", "Prof. Suman Bhattarai", "Dr. Kritika Poudel",
    "Prof. Ashish Magar", "Dr. Pooja Neupane", "Prof. Deepak Tamang", "Dr. Rekha Chhetri",
    "Prof. Sagar Pandey", "Dr. Muna Bhandari",
  ][i],
  specialization: [
    "Machine Learning", "Databases", "Networks", "Operating Systems", "Data Structures",
    "AI & Robotics", "Compilers", "Cybersecurity", "Cloud Computing", "Software Engg.",
    "Computer Vision", "NLP", "IoT & Embedded", "HCI", "Signal Processing",
    "Structural Analysis", "Thermodynamics", "Power Systems",
  ][i],
  department: depts[i % depts.length],
  courses: 2 + (i % 3),
  email: `teacher${i + 1}@college.edu`,
  phone: `+977 98-${1000 + i}-${2000 + i}`,
  status: i % 8 === 0 ? "on-leave" : "active",
  qualification: ["M.Sc. Computer Science", "Ph.D. Databases", "M.Sc. Networking", "Ph.D. Systems", "M.Sc. Computer Engg.", "Ph.D. AI", "M.Sc. Compilers", "Ph.D. Cyber Security", "M.Sc. Cloud Computing", "M.Sc. Software Engg.", "Ph.D. Computer Vision", "M.Sc. NLP", "M.Sc. Embedded Systems", "Ph.D. HCI", "M.Sc. Signal Processing", "M.Sc. Structural Engg.", "Ph.D. Thermodynamics", "M.Sc. Power Systems"][i],
  username: `teacher${i + 1}`,
  photo: `https://i.pravatar.cc/120?img=${(i * 4 + 5) % 60}`,
}));

export const saActivities = [
  { icon: "user", title: "HOD assigned", desc: "Dr. Kabita Gurung → Architecture Dept.", time: "12 min ago", tone: "primary" },
  { icon: "user", title: "Teacher created", desc: "Prof. Prashant Rijal · Comp. Engg.", time: "1 hr ago", tone: "success" },
  { icon: "check", title: "Department created", desc: "Information and Communication Engineering", time: "3 hrs ago", tone: "accent" },
  { icon: "bell", title: "System notice", desc: "Semester 5 schedule finalized", time: "Yesterday", tone: "info" },
  { icon: "award", title: "Backup completed", desc: "Weekly database backup successful", time: "Yesterday", tone: "warning" },
];

export const deptDistribution = depts.map((d, i) => ({
  name: d.split(" ")[0],
  teachers: [34, 28, 22, 26, 24, 20, 32, 28, 30][i],
  students: [612, 480, 410, 520, 460, 380, 900, 358, 500][i] / 10,
}));

export const yearlyGrowth = [
  { year: "2021", students: 3200, teachers: 160 },
  { year: "2022", students: 3550, teachers: 172 },
  { year: "2023", students: 3980, teachers: 188 },
  { year: "2024", students: 4310, teachers: 196 },
  { year: "2025", students: 4510, teachers: 204 },
  { year: "2026", students: 4820, teachers: 214 },
];

export const rolePie = [
  { name: "Students", value: 4820 },
  { name: "Teachers", value: 214 },
  { name: "HODs", value: 8 },
];