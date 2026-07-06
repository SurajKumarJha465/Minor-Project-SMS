/**
 * RecordList — a stack of RecordStrips, like a drawer of catalog cards.
 * Handles the empty state so every feature page doesn't reinvent it.
 *
 * Props:
 *  - items: array of raw records
 *  - renderStrip: (item, index) => <RecordStrip .../>
 *  - emptyTitle / emptyHint: copy for the empty state
 */
export default function RecordList({
  items = [],
  renderStrip,
  emptyTitle = 'No records yet',
  emptyHint = 'New entries will appear here once added.'
}) {
  if (!items.length) {
    return (
      <div className="border border-dashed border-paper-line rounded-card py-14 text-center bg-white/50">
        <p className="font-display text-lg text-ink-soft">{emptyTitle}</p>
        <p className="text-sm text-ink-faint mt-1">{emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-paper-line">
      {items.map((item, i) => (
        <div key={item.id ?? i}>{renderStrip(item, i)}</div>
      ))}
    </div>
  )
}
