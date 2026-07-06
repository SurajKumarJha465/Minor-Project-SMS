/**
 * AttributeCard — one floating field, styled like a single card-catalog index card.
 * A small mono "tab" carries the field label; the value sits below in display type.
 *
 * Props:
 *  - label: string           (e.g. "DEPARTMENT NAME")
 *  - value: string|node      (the field's value)
 *  - tone: 'default'|'indigo'|'sage'|'amber'|'brick'  (accent for the tab)
 *  - width: tailwind width class override (default: flexible)
 *  - mono: render value in mono (good for codes/ids)
 */
const TONE_MAP = {
  default: 'text-ink-faint border-paper-line',
  indigo: 'text-indigo border-indigo/30',
  sage: 'text-sage border-sage/40',
  amber: 'text-amber border-amber/40',
  brick: 'text-brick border-brick/40'
}

export default function AttributeCard({
  label,
  value,
  tone = 'default',
  mono = false,
  className = ''
}) {
  return (
    <div
      className={`group relative flex-1 min-w-[140px] bg-white border border-paper-line
                  rounded-card shadow-card hover:shadow-lifted hover:-translate-y-[2px]
                  transition-all duration-150 ease-out px-4 pt-5 pb-3 ${className}`}
    >
      {/* the "catalog tab" */}
      <span
        className={`absolute -top-2.5 left-3 px-1.5 bg-paper-dim border rounded-[4px]
                    label-tab ${TONE_MAP[tone] || TONE_MAP.default}`}
      >
        {label}
      </span>
      <div className={`text-[15px] leading-snug text-ink truncate ${mono ? 'font-mono' : 'font-body font-medium'}`}>
        {value ?? <span className="text-ink-faint">—</span>}
      </div>
    </div>
  )
}
