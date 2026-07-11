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

const depts = [
  "Computer Engineering", "Electronics & Comm.", "Civil Engineering", "Mechanical Engineering",
  "Electrical Engineering", "IT & Cyber Security", "Applied Sciences", "Architecture",
];

export const hods = depts.map((d, i) => ({
  id: `H${100 + i}`,
  name: [
    "Dr. Rajendra Prasad", "Dr. Sunita Rana", "Dr. Bikash Adhikari", "Dr. Manisha Karki",
    "Dr. Ramesh Shrestha", "Dr. Prakash Thapa", "Dr. Anita Sharma", "Dr. Kabita Gurung",
  ][i],
  department: d,
  email: `hod.${d.split(" ")[0].toLowerCase()}@college.edu`,
  phone: `+977 98-11${(10 + i).toString()}-22${(10 + i).toString()}`,
  status: i === 5 ? "on-leave" : "active",
  qualification: ["Ph.D. Computer Engineering", "Ph.D. Electronics", "Ph.D. Civil Engineering", "Ph.D. Mechanical Engineering", "Ph.D. Electrical Engineering", "Ph.D. Cyber Security", "Ph.D. Applied Physics", "M.Arch, Ph.D. Architecture"][i],
  experience: `${8 + i} years`,
  assignedSince: ["Aug 2019", "Jan 2020", "Jul 2021", "Mar 2022", "Sep 2020", "Feb 2023", "Nov 2018", "Apr 2024"][i],
  photo: `https://i.pravatar.cc/120?img=${(i * 5 + 20) % 60}`,
}));

export const hodDepartmentOptions = depts;

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

// ---------------------------------------------------------------------------
// Department / semester / course catalog used by the "Add Teacher" workflow
// and the Student Management drill-down (department -> semester -> students)
// ---------------------------------------------------------------------------
export const departmentList = [
  "Software Engineering",
  "Computer Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Architecture",
  "BCA",
  "Management",
] as const;

const subjectPools: Record<string, string[]> = {
  "Software Engineering": [
    "Programming Fundamentals", "Discrete Mathematics", "Data Structures", "Digital Logic",
    "Object Oriented Programming", "Database Systems", "Operating Systems", "Web Technologies",
    "Software Engineering", "Computer Networks", "Design Patterns", "Mobile App Development",
    "Artificial Intelligence", "Cloud Computing", "Software Project Management", "Capstone Project",
  ],
  "Computer Engineering": [
    "Engineering Mathematics", "Digital Logic Design", "Data Structures", "Computer Architecture",
    "Microprocessors", "Operating Systems", "Computer Networks", "Embedded Systems",
    "Database Systems", "Computer Graphics", "Compiler Design", "VLSI Design",
    "Machine Learning", "IoT Systems", "Robotics", "Major Project",
  ],
  "Electrical Engineering": [
    "Engineering Mathematics", "Circuit Theory", "Electrical Machines I", "Electronics Devices",
    "Signals & Systems", "Electrical Machines II", "Power Systems I", "Control Systems",
    "Power Electronics", "Power Systems II", "Renewable Energy Systems", "Electrical Drives",
    "High Voltage Engineering", "Smart Grid Technology", "Industrial Automation", "Major Project",
  ],
  "Civil Engineering": [
    "Engineering Mathematics", "Engineering Drawing", "Surveying", "Building Materials",
    "Structural Analysis I", "Fluid Mechanics", "Structural Analysis II", "Geotechnical Engineering",
    "Concrete Technology", "Transportation Engineering", "Water Resources Engineering", "Steel Structures",
    "Construction Management", "Earthquake Engineering", "Environmental Engineering", "Major Project",
  ],
  "Architecture": [
    "Architectural Graphics", "History of Architecture I", "Building Construction I", "Architectural Design I",
    "History of Architecture II", "Building Construction II", "Architectural Design II", "Theory of Structures",
    "Climatology & Design", "Architectural Design III", "Urban Design", "Landscape Architecture",
    "Building Services", "Architectural Design IV", "Sustainable Architecture", "Thesis Project",
  ],
  "BCA": [
    "Computer Fundamentals", "Digital Logic", "Programming in C", "Discrete Structures",
    "Object Oriented Programming", "Data Structures & Algorithms", "Database Management Systems", "Computer Networks",
    "Web Technology", "Operating Systems", "Software Engineering", "Mobile Application Development",
    "Artificial Intelligence", "Cloud Computing", "E-Business", "Final Project",
  ],
  "Management": [
    "Principles of Management", "Business Mathematics", "Financial Accounting", "Microeconomics",
    "Business Communication", "Organizational Behaviour", "Marketing Management", "Business Statistics",
    "Human Resource Management", "Financial Management", "Operations Management", "Business Law",
    "Strategic Management", "Entrepreneurship", "Business Research Methods", "Capstone Project",
  ],
};

const codePrefix: Record<string, string> = {
  "Software Engineering": "SE", "Computer Engineering": "CE", "Electrical Engineering": "EE",
  "Civil Engineering": "CV", "Architecture": "AR", "BCA": "BCA", "Management": "MGT",
};

export type Course = { code: string; name: string; credit: number };

export const courseCatalog: Record<string, Record<number, Course[]>> = Object.fromEntries(
  departmentList.map((dept) => {
    const pool = subjectPools[dept];
    const bySemester: Record<number, Course[]> = {};
    for (let sem = 1; sem <= 8; sem++) {
      const [a, b] = [pool[(sem - 1) * 2], pool[(sem - 1) * 2 + 1]];
      bySemester[sem] = [
        { code: `${codePrefix[dept]}${sem}01`, name: a, credit: 3 },
        { code: `${codePrefix[dept]}${sem}02`, name: b, credit: sem > 6 ? 4 : 3 },
      ];
    }
    return [dept, bySemester];
  }),
);

const studentNames = [
  "Anisha Karki", "Rohan Thapa", "Priya Rai", "Bikash Gurung", "Sneha Shrestha",
  "Aayush Basnet", "Nisha Adhikari", "Sujan Lama", "Manisha KC", "Prabin Sapkota",
  "Ritika Joshi", "Suman Bhattarai", "Kritika Poudel", "Ashish Magar", "Pooja Neupane",
  "Deepak Tamang", "Rekha Chhetri", "Sagar Pandey", "Muna Bhandari", "Nabin Regmi",
  "Sushmita Dahal", "Bibek Ghimire", "Alina Shakya", "Prashant Rijal", "Kiran Bogati",
  "Sabina Lama", "Yuvraj Khadka", "Sarita Bista", "Nikesh Poudel", "Aashma Rana",
  "Bishal Karki", "Sunita Magar", "Rajan Shrestha", "Ista Gautam", "Milan Tamang",
  "Grishma Adhikari", "Saroj KC", "Kabita Rai", "Diwas Bhattarai", "Anju Thapa",
  "Sandip Basnet", "Reshma Gurung", "Utsav Joshi", "Bindu Chhetri", "Pratik Regmi",
  "Sarina Dahal", "Hemant Poudel", "Bikalpa Shakya", "Sristi Karki", "Anmol Ghimire",
  "Puja Sapkota", "Rabin Lama", "Sabnam KC", "Dipesh Rana", "Menuka Bista",
  "Aakash Bogati",
];

export const saStudents = departmentList.flatMap((dept, di) =>
  Array.from({ length: 8 }).map((_, si) => {
    const sem = si + 1;
    const idx = di * 8 + si;
    const name = studentNames[idx % studentNames.length];
    return {
      id: `S${5000 + idx}`,
      name,
      enrollment: `${codePrefix[dept]}-2023-${(idx + 1).toString().padStart(3, "0")}`,
      department: dept,
      semester: sem,
      batch: `${2023 + Math.floor(sem / 3)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@student.college.edu`,
      phone: `+977 98-${4000 + idx}-${6000 + idx}`,
      address: ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Butwal", "Biratnagar"][idx % 6] + ", Nepal",
      guardianName: ["Mr. " + name.split(" ")[1] + " Sr.", "Mrs. " + name.split(" ")[1]][idx % 2],
      guardianPhone: `+977 98-${7000 + idx}-${8000 + idx}`,
      attendance: 65 + ((idx * 7) % 33),
      gpa: (2.4 + ((idx * 13) % 160) / 100).toFixed(2),
      status: idx % 9 === 0 ? "at-risk" : "active",
      coursesEnrolled: courseCatalog[dept][sem].map((c) => c.name),
      photo: `https://i.pravatar.cc/120?img=${(idx + 3) % 60}`,
    };
  }),
);

export const saActivities = [
  { icon: "user", title: "HOD assigned", desc: "Dr. Kabita Gurung → Architecture Dept.", time: "12 min ago", tone: "primary" },
  { icon: "user", title: "Teacher created", desc: "Prof. Prashant Rijal · Comp. Engg.", time: "1 hr ago", tone: "success" },
  { icon: "check", title: "Department created", desc: "IT & Cyber Security", time: "3 hrs ago", tone: "accent" },
  { icon: "bell", title: "System notice", desc: "Semester 5 schedule finalized", time: "Yesterday", tone: "info" },
  { icon: "award", title: "Backup completed", desc: "Weekly database backup successful", time: "Yesterday", tone: "warning" },
];

export const deptDistribution = depts.map((d, i) => ({
  name: d.split(" ")[0],
  teachers: [34, 28, 22, 26, 24, 20, 32, 28][i],
  students: [612, 480, 410, 520, 460, 380, 900, 358][i] / 10,
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
