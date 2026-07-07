import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import SearchInput from '../../../components/ui/SearchInput.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import roleConfig from '../../../config/roleConfig.js'
import userStats from '../../../data/mock/users.js'
import seedEnrollments from '../../../data/mock/enrollments.js'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }
]

export default function EnrollmentApprovals() {
  const [enrollments, setEnrollments] = useState(seedEnrollments)
  const [tab, setTab] = useState('pending')
  const [query, setQuery] = useState('')

  const counts = useMemo(
    () => ({
      pending: enrollments.filter((e) => e.status === 'pending').length,
      approved: enrollments.filter((e) => e.status === 'approved').length,
      rejected: enrollments.filter((e) => e.status === 'rejected').length
    }),
    [enrollments]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return enrollments.filter((e) => {
      const matchesTab = e.status === tab
      const matchesQuery =
        !q ||
        e.student_name.toLowerCase().includes(q) ||
        e.enrollment_no.toLowerCase().includes(q) ||
        e.course_name.toLowerCase().includes(q)
      return matchesTab && matchesQuery
    })
  }, [enrollments, tab, query])

  const setStatus = (id, status) =>
    setEnrollments((list) => list.map((e) => (e.enroll_id === id ? { ...e, status } : e)))

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Enrollment Approvals"
      subtitle={`${counts.pending} request${counts.pending === 1 ? '' : 's'} awaiting review`}
      user={userStats.currentUser}
    >
      <Tabs
        tabs={TABS.map((t) => ({ ...t, count: counts[t.key] }))}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-5 max-w-xs">
        <SearchInput value={query} onChange={setQuery} placeholder="Search student, ID, or course…" />
      </div>

      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        <RecordList
          items={filtered}
          emptyTitle={`No ${tab} enrollments`}
          emptyHint="Nothing here right now — check another tab."
          renderStrip={(e) => (
            <RecordStrip
              fields={[
                { label: 'ENROLLMENT NO.', value: e.enrollment_no, mono: true, tone: 'indigo' },
                { label: 'STUDENT', value: e.student_name },
                { label: 'COURSE', value: `${e.course_name} (${e.course_code})` },
                { label: 'REQUESTED', value: e.enrolled_at, mono: true },
                { label: 'STATUS', value: <Pill>{e.status}</Pill> }
              ]}
              actions={
                tab === 'pending' && (
                  <>
                    <button
                      onClick={() => setStatus(e.enroll_id, 'approved')}
                      aria-label="Approve enrollment"
                      className="p-2 rounded-[8px] text-ink-faint hover:text-sage hover:bg-sage-tint transition-colors"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={() => setStatus(e.enroll_id, 'rejected')}
                      aria-label="Reject enrollment"
                      className="p-2 rounded-[8px] text-ink-faint hover:text-brick hover:bg-brick-tint transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </>
                )
              }
            />
          )}
        />
      </div>
    </DashboardShell>
  )
}
