/**
 * RecordStrip — one row of AttributeCards clipped together like a punch-card strip.
 * Optionally renders trailing action buttons (edit/delete/etc) at the row's right edge.
 *
 * Props:
 *  - fields: [{ label, value, tone, mono }]
 *  - actions: node (rendered at the right edge, e.g. edit/delete icon buttons)
 *  - onClick: optional row click handler (e.g. open detail modal)
 */
import AttributeCard from './AttributeCard.jsx'

export default function RecordStrip({ fields = [], actions, onClick, className = '' }) {
  return (
    <div
      className={`flex items-stretch gap-3 py-1.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-1 gap-3 flex-wrap sm:flex-nowrap">
        {fields.map((f, i) => (
          <AttributeCard key={i} {...f} />
        ))}
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 pl-1 shrink-0">{actions}</div>
      )}
    </div>
  )
}
