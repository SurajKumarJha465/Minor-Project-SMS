import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './features/auth/pages/Login.jsx'
import SuperAdminDashboard from './features/super-admin/pages/Dashboard.jsx'
import Departments from './features/super-admin/pages/Departments.jsx'
import Users from './features/super-admin/pages/Users.jsx'
import Students from './features/super-admin/pages/Students.jsx'
import Courses from './features/super-admin/pages/Courses.jsx'
import EnrollmentApprovals from './features/super-admin/pages/EnrollmentApprovals.jsx'
import ResultsPublishing from './features/super-admin/pages/ResultsPublishing.jsx'
import HodOverview from './features/hod/pages/Overview.jsx'
import SemesterWorkspace from './features/hod/pages/SemesterWorkspace.jsx'
import Notices from './features/hod/pages/Notices.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Super Admin module — module 1, complete */}
      <Route path="/admin" element={<SuperAdminDashboard />} />
      <Route path="/admin/departments" element={<Departments />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/students" element={<Students />} />
      <Route path="/admin/courses" element={<Courses />} />
      <Route path="/admin/enrollments" element={<EnrollmentApprovals />} />
      <Route path="/admin/results" element={<ResultsPublishing />} />

      {/* HOD module — module 2 */}
      <Route path="/hod" element={<HodOverview />} />
      <Route path="/hod/semester" element={<SemesterWorkspace />} />
      <Route path="/hod/notices" element={<Notices />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}