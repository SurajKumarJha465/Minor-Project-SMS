import {
  LayoutGrid, Building2, Users, GraduationCap, BookOpen,
  ClipboardCheck, CalendarCheck, FileBarChart2, UserCog, Layers
} from 'lucide-react'

/**
 * Single source of truth for each role's dashboard: label, base route,
 * accent tone, and sidebar nav items. Feature pages register their route
 * here so Sidebar/Topbar never need role-specific branching logic.
 */
const roleConfig = {
  superAdmin: {
    label: 'Super Admin',
    base: '/admin',
    tone: 'indigo',
    nav: [
      { label: 'Overview', icon: LayoutGrid, to: '/admin' },
      { label: 'Departments', icon: Building2, to: '/admin/departments' },
      { label: 'Users & Roles', icon: UserCog, to: '/admin/users' },
      { label: 'Semesters & Courses', icon: Layers, to: '/admin/courses' },
      { label: 'Enrollment Approvals', icon: ClipboardCheck, to: '/admin/enrollments' },
      { label: 'Results Publishing', icon: FileBarChart2, to: '/admin/results' }
    ]
  },
  hod: {
    label: 'Head of Department',
    base: '/hod',
    tone: 'indigo',
    nav: [
      { label: 'Overview', icon: LayoutGrid, to: '/hod' },
      { label: 'Teachers', icon: Users, to: '/hod/teachers' },
      { label: 'Courses', icon: BookOpen, to: '/hod/courses' },
      { label: 'Approvals', icon: ClipboardCheck, to: '/hod/approvals' }
    ]
  },
  teacher: {
    label: 'Teacher',
    base: '/teacher',
    tone: 'sage',
    nav: [
      { label: 'My Courses', icon: BookOpen, to: '/teacher' },
      { label: 'Marks Entry', icon: FileBarChart2, to: '/teacher/marks' },
      { label: 'Attendance', icon: CalendarCheck, to: '/teacher/attendance' }
    ]
  },
  student: {
    label: 'Student',
    base: '/student',
    tone: 'amber',
    nav: [
      { label: 'Overview', icon: LayoutGrid, to: '/student' },
      { label: 'My Enrollments', icon: GraduationCap, to: '/student/enrollments' },
      { label: 'Internal Marks', icon: FileBarChart2, to: '/student/marks' },
      { label: 'Attendance', icon: CalendarCheck, to: '/student/attendance' },
      { label: 'Result', icon: ClipboardCheck, to: '/student/result' }
    ]
  }
}

export default roleConfig
