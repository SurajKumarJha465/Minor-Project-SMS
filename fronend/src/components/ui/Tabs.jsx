/**
 * Tabs — small underline-style tab switcher. Used where one page manages
 * two related record types (e.g. Semesters vs Courses).
 *
 * Props:
 *  - tabs: [{ key, label, count }]
 *  - active: current active key
 *  - onChange: (key) => void
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-paper-line mb-5">
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                        ${isActive ? 'text-indigo' : 'text-ink-faint hover:text-ink-soft'}`}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-1.5 font-mono text-[11px] text-ink-faint">({t.count})</span>
            )}
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-indigo rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
