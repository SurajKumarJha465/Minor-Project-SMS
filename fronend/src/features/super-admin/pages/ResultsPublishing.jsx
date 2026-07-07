import { useState } from 'react'
import { Upload } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import Button from '../../../components/ui/Button.jsx'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import roleConfig from '../../../config/roleConfig.js'
import userStats from '../../../data/mock/users.js'
import seedResults from '../../../data/mock/results.js'

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function ResultsPublishing() {
  const [results, setResults] = useState(seedResults)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const publish = () => {
    setResults((list) =>
      list.map((r) =>
        r.semester_id === confirmTarget.semester_id
          ? { ...r, status: 'published', published_at: todayISO() }
          : r
      )
    )
    setConfirmTarget(null)
  }

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Results Publishing"
      subtitle="Release finalized GPAs to students, one semester batch at a time"
      user={userStats.currentUser}
    >
      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        <RecordList
          items={results}
          renderStrip={(r) => (
            <RecordStrip
              fields={[
                { label: 'SEM ID', value: `SEM-${String(r.semester_id).padStart(2, '0')}`, mono: true, tone: 'indigo' },
                { label: 'SEMESTER', value: `Sem ${r.sem_number} · ${r.department}` },
                { label: 'ACADEMIC YEAR', value: r.academic_year, mono: true },
                { label: 'STUDENTS', value: r.total_students, mono: true },
                { label: 'AVG GPA', value: r.avg_gpa ?? '—', mono: true },
                {
                  label: 'STATUS',
                  value: (
                    <Pill>{r.status === 'published' ? `Published ${r.published_at}` : 'Draft'}</Pill>
                  )
                }
              ]}
              actions={
                r.status !== 'published' ? (
                  <Button size="sm" icon={Upload} onClick={() => setConfirmTarget(r)}>
                    Publish
                  </Button>
                ) : (
                  <span className="text-xs text-ink-faint pr-2">Live for students</span>
                )
              }
            />
          )}
        />
      </div>

      <FloatingModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        eyebrow="Confirm"
        title="Publish this result batch?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button variant="solid" onClick={publish}>Yes, publish</Button>
          </>
        }
      >
        {confirmTarget && (
          <p className="text-sm text-ink-soft leading-relaxed">
            This makes GPAs for <b>{confirmTarget.total_students} students</b> in{' '}
            <b>Sem {confirmTarget.sem_number} · {confirmTarget.department}</b> visible on their
            individual result pages immediately. This action can't be undone from here.
          </p>
        )}
      </FloatingModal>
    </DashboardShell>
  )
}
