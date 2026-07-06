/**
 * Pill — small status badge. Tone maps to the same semantic colors as AttributeCard tabs.
 */
const TONE_MAP = {
  neutral: 'bg-paper-line/70 text-ink-soft',
  indigo: 'bg-indigo-tint text-indigo',
  sage: 'bg-sage-tint text-sage',
  amber: 'bg-amber-tint text-amber',
  brick: 'bg-brick-tint text-brick'
}

const STATUS_TONE = {
  active: 'sage',
  approved: 'sage',
  published: 'sage',
  pending: 'amber',
  draft: 'amber',
  inactive: 'brick',
  rejected: 'brick',
  suspended: 'brick'
}

export default function Pill({ children, tone }) {
  const resolvedTone =
    tone || STATUS_TONE[String(children).toLowerCase()] || 'neutral'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono
                  text-[11px] uppercase tracking-wide ${TONE_MAP[resolvedTone]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {children}
    </span>
  )
}
