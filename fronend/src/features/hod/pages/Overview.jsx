import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import AttributeCard from '../../../components/ui/AttributeCard.jsx'
import roleConfig from '../../../config/roleConfig.js'
import hodContext from '../../../data/mock/hodContext.js'
import hodSemesters from '../../../data/mock/hodSemesters.js'
import sectionProgress from '../../../data/mock/sectionProgress.js'
import SemesterFloatingInfo from '../components/SemesterFloatingInfo.jsx'

// Recharts needs one entry per bar-group; label each section with its semester
// so "Sem 5 - A" and "Sem 3 - A" don't collide on the X axis.
const chartData = sectionProgress.map((p) => ({
  label: `Sem ${p.sem_number} · ${p.section}`,
  Passed: p.passed_pct,
  Attendance: p.attendance_pct,
  'Internal Marks': p.internal_marks_pct
}))

export default function HodOverview() {
  const { department, currentUser } = hodContext

  return (
    <DashboardShell
      role={roleConfig.hod}
      title="Department Overview"
      subtitle={`${department.department_name} · at a glance`}
      user={currentUser}
    >
      <div className="flex gap-3 flex-wrap mb-8">
        <AttributeCard label="TOTAL TEACHERS" value={department.total_teachers} mono tone="indigo" />
        <AttributeCard label="TOTAL STUDENTS" value={department.total_students} mono />
        <AttributeCard label="TOTAL COURSES" value={department.total_courses} mono />
        <AttributeCard
          label="ACTIVE SEMESTERS"
          value={hodSemesters.filter((s) => s.status === 'active').length}
          mono
          tone="sage"
        />
      </div>

      <h2 className="font-display text-lg mb-1">Student progress by section</h2>
      <p className="text-sm text-ink-faint mb-4">
        Pass rate, attendance, and average internal marks — all shown as a percentage
      </p>

      <div className="bg-white border border-paper-line rounded-card shadow-card p-5 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFCF" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#4A5164' }} />
            <YAxis tick={{ fontSize: 12, fill: '#4A5164' }} unit="%" />
            <Tooltip
              contentStyle={{
                background: '#FAF8F1',
                border: '1px solid #E4DFCF',
                borderRadius: 8,
                fontSize: 13
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Passed" fill="#7C9473" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attendance" fill="#3A4A78" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Internal Marks" fill="#C68A3E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SemesterFloatingInfo semesters={hodSemesters} />
    </DashboardShell>
  )
}