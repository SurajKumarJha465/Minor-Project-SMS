import { useState } from 'react'
import { X, Layers } from 'lucide-react'
import AttributeCard from '../../../components/ui/AttributeCard.jsx'

/**
 * SemesterFloatingInfo — a small floating window (fixed position, lifted shadow)
 * summarizing the department's currently active semester(s). Dismissible per
 * session; distinct from FloatingModal since it doesn't block the page.
 */
export default function SemesterFloatingInfo({ semesters }) {
  const [dismissed, setDismissed] = useState(false)
  const active = semesters.filter((s) => s.status === 'active')

  if (dismissed || !active.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-paper-dim border border-paper-line
                     rounded-card shadow-modal p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-indigo">
          <Layers size={15} />
          <span className="label-tab text-indigo">ACTIVE SEMESTERS</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-ink-faint hover:text-ink transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-3">
        {active.map((s) => (
          <div key={s.sem_number} className="flex gap-2">
            <AttributeCard label="SEMESTER" value={`Sem ${s.sem_number}`} mono tone="indigo" className="min-w-0" />
            <AttributeCard label="YEAR" value={s.academic_year} mono className="min-w-0" />
            <AttributeCard label="STUDENTS" value={s.total_students} mono className="min-w-0" />
          </div>
        ))}
      </div>
    </div>
  )
}