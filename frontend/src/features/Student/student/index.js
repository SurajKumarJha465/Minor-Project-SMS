// Student module manifest — registers navigation + pages.
import {
  BookOpen,
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Settings as SettingsIcon,
  UserCheck,
  UserRound,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import Attendance from "./pages/Attendance";
import InternalMarks from "./pages/InternalMarks";
import SemesterResults from "./pages/SemesterResults";
import NoticeBoard from "./pages/NoticeBoard";
import AcademicCalendar from "./pages/AcademicCalendar";
import Settings from "./pages/Settings";

const crumb = (label) => ["Student", label];

export const studentModule = {
  id: "student",
  label: "Student",
  defaultPage: "dashboard",
  nav: [
    {
      section: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, breadcrumb: crumb("Dashboard") },
        { id: "profile", label: "My Profile", icon: UserRound, breadcrumb: crumb("My Profile") },
        { id: "courses", label: "My Courses", icon: BookOpen, breadcrumb: crumb("My Courses") },
      ],
    },
    {
      section: "Academics",
      items: [
        { id: "attendance", label: "Attendance", icon: UserCheck, breadcrumb: crumb("Attendance") },
        { id: "internal-marks", label: "Internal Marks", icon: ListChecks, breadcrumb: crumb("Internal Marks") },
        { id: "semester-results", label: "Semester Results", icon: FileBarChart, breadcrumb: crumb("Semester Results") },
      ],
    },
    {
      section: "Tools",
      items: [
        { id: "notice-board", label: "Notice Board", icon: Megaphone, breadcrumb: crumb("Notice Board") },
        { id: "academic-calendar", label: "Academic Calendar", icon: CalendarDays, breadcrumb: crumb("Academic Calendar") },
      ],
    },
    {
      section: "Account",
      items: [
        { id: "settings", label: "Settings", icon: SettingsIcon, breadcrumb: crumb("Settings") },
      ],
    },
  ],
  pages: {
    dashboard: Dashboard,
    profile: Profile,
    courses: Courses,
    attendance: Attendance,
    "internal-marks": InternalMarks,
    "semester-results": SemesterResults,
    "notice-board": NoticeBoard,
    "academic-calendar": AcademicCalendar,
    settings: Settings,
  },
};

export default studentModule;