import { useMemo, useState } from 'react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import roleConfig from '../../../config/roleConfig.js'
import userStats from '../../../data/mock/users.js'
import departments from '../../../data/mock/departments.js'
import semesters from '../../../data/mock/semesters.js'
import students from '../../../data/mock/students.js'

export default function Students() {
  const [departmentName, setDepartmentName] = useState('')
  const [semNumber, setSemNumber] = useState('')

  const availableSemesters = useMemo(() => {
    if (!departmentName) return []
    return semesters
      .filter((s) => s.department === departmentName)
      .map((s) => s.sem_number)
      .sort((a, b) => a - b)
  }, [departmentName])

  const results = useMemo(() => {
    if (!departmentName || !semNumber) return []
    return students.filter(
      (s) => s.department === departmentName && s.sem_number === Number(semNumber)
    )
  }, [departmentName, semNumber])

  const hasSelection = departmentName && semNumber

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Students"
      subtitle="View-only — select a department and semester to see who's enrolled"
      user={userStats.currentUser}
    >
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="min-w-[220px]">
          <label className="label-tab block mb-1.5">DEPARTMENT</label>
          <select
            value={departmentName}
            onChange={(e) => { setDepartmentName(e.target.value); setSemNumber('') }}
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          >
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[180px]">
          <label className="label-tab block mb-1.5">SEMESTER</label>
          <select
            value={semNumber}
            onChange={(e) => setSemNumber(e.target.value)}
            disabled={!departmentName}
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{departmentName ? 'Select semester…' : 'Pick a department first'}</option>
            {availableSemesters.map((n) => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        {!hasSelection ? (
          <div className="py-14 text-center">
            <p className="font-display text-lg text-ink-soft">Choose a department and semester</p>
            <p className="text-sm text-ink-faint mt-1">Student records appear here once both are selected.</p>
          </div>
        ) : (
          <RecordList
            items={results}
            emptyTitle="No students found"
            emptyHint="No one is on record for this department and semester yet."
            renderStrip={(s) => (
              <RecordStrip
                fields={[
                  { label: 'ENROLLMENT NO.', value: s.enrollment_no, mono: true, tone: 'indigo' },
                  { label: 'NAME', value: s.name },
                  { label: 'DEPARTMENT', value: s.department },
                  { label: 'SEMESTER', value: `Semester ${s.sem_number}`, mono: true },
                  { label: 'STATUS', value: <Pill>{s.status}</Pill> }
                ]}
              />
            )}
          />
        )}
      </div>
    </DashboardShell>
  )
}