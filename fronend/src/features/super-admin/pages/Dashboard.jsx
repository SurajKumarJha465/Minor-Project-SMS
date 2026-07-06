import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import AttributeCard from '../../../components/ui/AttributeCard.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import roleConfig from '../../../config/roleConfig.js'
import departments from '../../../data/mock/departments.js'
import users from '../../../data/mock/users.js'

export default function SuperAdminDashboard() {
  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Registry Overview"
      subtitle="A live index of the institution's people and structure"
      user={users.currentUser}
    >
      {/* top-line metrics as a strip of floating cards */}
      <div className="flex gap-3 flex-wrap mb-8">
        <AttributeCard label="TOTAL USERS" value={users.totalUsers} mono tone="indigo" />
        {users.byRole.map((r) => (
          <AttributeCard key={r.role} label={r.role.toUpperCase()} value={r.count} mono />
        ))}
        <AttributeCard
          label="PENDING ENROLLMENTS"
          value={users.pendingEnrollments}
          mono
          tone="amber"
        />
      </div>

      <h2 className="font-display text-lg mb-3">Departments at a glance</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((d) => (
          <div
            key={d.department_id}
            className="bg-white border border-paper-line rounded-card shadow-card p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="label-tab text-indigo">
                DEPT-{String(d.department_id).padStart(2, '0')}
              </span>
              <Pill>{d.status}</Pill>
            </div>
            <h3 className="font-display text-base mb-1">{d.department_name}</h3>
            <p className="text-xs text-ink-faint mb-3">HOD: {d.hod_name}</p>
            <div className="flex gap-4 text-sm">
              <span><b className="font-mono">{d.total_teachers}</b> <span className="text-ink-faint">teachers</span></span>
              <span><b className="font-mono">{d.total_students}</b> <span className="text-ink-faint">students</span></span>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  )
}
