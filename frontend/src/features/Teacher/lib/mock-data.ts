export const teacher = {
  name: "Aarav Sharma",
  title: "Prof.",
  department: "Computer Engineering",
  specialization: "Machine Learning & Data Structures",
  qualification: "Ph.D. in Computer Science",
  email: "aarav.sharma@college.edu",
  phone: "+977 98-1234-5678",
  office: "Block B — Room 214",
  officeHours: "Mon–Fri · 2:00 – 4:00 PM",
  experience: "8 years",
  photo: "https://i.pravatar.cc/160?img=15",
  semester: "Fall 2026 · Semester 5",
};

export const analytics = [
  { key: "courses", label: "Courses Assigned", value: 4, delta: "+1", tone: "primary" },
  { key: "students", label: "Students Teaching", value: 186, delta: "+12", tone: "accent" },
  { key: "today", label: "Today's Classes", value: 3, delta: "2 left", tone: "info" },
  { key: "pendingAtt", label: "Attendance Pending", value: 2, delta: "today", tone: "warning" },
  { key: "pendingRev", label: "Assignments to Review", value: 27, delta: "+8", tone: "warning" },
  { key: "submitted", label: "Assignments Submitted", value: 142, delta: "94%", tone: "success" },
  { key: "avgAtt", label: "Avg Student Attendance", value: "87%", delta: "+2%", tone: "success" },
  { key: "avgMarks", label: "Avg Internal Marks", value: "78.4", delta: "/100", tone: "primary" },
];

export const courses = [
  { id: "cs501", code: "CS-501", name: "Machine Learning", credits: 4, sem: 5, dept: "Computer Engg.", enrolled: 52, attendance: 89, completion: 62 },
  { id: "cs402", code: "CS-402", name: "Data Structures", credits: 3, sem: 4, dept: "Computer Engg.", enrolled: 61, attendance: 84, completion: 78 },
  { id: "cs603", code: "CS-603", name: "Advanced Algorithms", credits: 4, sem: 6, dept: "Computer Engg.", enrolled: 38, attendance: 91, completion: 45 },
  { id: "cs305", code: "CS-305", name: "Database Systems", credits: 3, sem: 3, dept: "Computer Engg.", enrolled: 35, attendance: 82, completion: 88 },
];

export const students = Array.from({ length: 24 }).map((_, i) => ({
  id: `S${1000 + i}`,
  name: [
    "Anisha Karki", "Rohan Thapa", "Priya Rai", "Bikash Gurung", "Sneha Shrestha",
    "Aayush Basnet", "Nisha Adhikari", "Sujan Lama", "Manisha KC", "Prabin Sapkota",
    "Ritika Joshi", "Suman Bhattarai", "Kritika Poudel", "Ashish Magar", "Pooja Neupane",
    "Deepak Tamang", "Rekha Chhetri", "Sagar Pandey", "Muna Bhandari", "Nabin Regmi",
    "Sushmita Dahal", "Bibek Ghimire", "Anita Subedi", "Kiran Shah",
  ][i],
  enrollment: `CE-2023-${(i + 1).toString().padStart(3, "0")}`,
  photo: `https://i.pravatar.cc/120?img=${(i % 60) + 1}`,
  attendance: 65 + ((i * 7) % 33),
  internal: 55 + ((i * 11) % 40),
  status: "present" as "present" | "absent" | "late" | "leave",
}));

export const attendanceTrend = [
  { day: "Mon", ML: 88, DS: 82, ALG: 90, DB: 80 },
  { day: "Tue", ML: 91, DS: 85, ALG: 87, DB: 83 },
  { day: "Wed", ML: 86, DS: 88, ALG: 92, DB: 79 },
  { day: "Thu", ML: 90, DS: 84, ALG: 89, DB: 84 },
  { day: "Fri", ML: 93, DS: 87, ALG: 94, DB: 86 },
  { day: "Sat", ML: 84, DS: 80, ALG: 88, DB: 82 },
];

export const submissionData = [
  { name: "Assign 1", submitted: 48, pending: 4 },
  { name: "Assign 2", submitted: 45, pending: 7 },
  { name: "Assign 3", submitted: 50, pending: 2 },
  { name: "Assign 4", submitted: 39, pending: 13 },
  { name: "Assign 5", submitted: 46, pending: 6 },
];

export const marksDistribution = [
  { range: "0-40", count: 3 },
  { range: "40-55", count: 8 },
  { range: "55-70", count: 22 },
  { range: "70-85", count: 31 },
  { range: "85-100", count: 14 },
];

export const performanceTrend = [
  { month: "Jan", gpa: 3.1 },
  { month: "Feb", gpa: 3.2 },
  { month: "Mar", gpa: 3.4 },
  { month: "Apr", gpa: 3.3 },
  { month: "May", gpa: 3.5 },
  { month: "Jun", gpa: 3.6 },
  { month: "Jul", gpa: 3.7 },
];

export const activities = [
  { icon: "check", title: "Attendance taken", desc: "CS-501 Machine Learning · 52 students", time: "20 min ago", tone: "success" },
  { icon: "award", title: "Marks published", desc: "CS-603 · Unit Test 2", time: "3 hrs ago", tone: "accent" },
  { icon: "bell", title: "Notice posted", desc: "Guest lecture on Transformers · Wed 4 PM", time: "Yesterday", tone: "warning" },
  { icon: "file", title: "Report generated", desc: "CS-402 · Internal Marks report exported", time: "Yesterday", tone: "info" },
  { icon: "message", title: "Profile updated", desc: "Office hours updated for this term", time: "2 days ago", tone: "primary" },
];

export const schedule = [
  { time: "09:00 – 10:00", course: "CS-501 · Machine Learning", room: "B-214", type: "Lecture" },
  { time: "11:00 – 12:30", course: "CS-402 · Data Structures", room: "B-108", type: "Lab" },
  { time: "14:00 – 15:00", course: "CS-603 · Advanced Algorithms", room: "B-301", type: "Lecture" },
];
