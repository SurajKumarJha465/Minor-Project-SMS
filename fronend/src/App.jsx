import { Routes, Route, Navigate } from 'react-router-dom'
import SuperAdminDashboard from './features/super-admin/pages/Dashboard.jsx'
import Departments from './features/super-admin/pages/Departments.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Super Admin module — module 1 */}
      <Route path="/admin" element={<SuperAdminDashboard />} />
      <Route path="/admin/departments" element={<Departments />} />
      {/* /admin/users, /admin/courses, /admin/enrollments, /admin/results
          will slot in here as their pages are built */}

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
