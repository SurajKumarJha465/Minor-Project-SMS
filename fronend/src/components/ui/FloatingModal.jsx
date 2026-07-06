import { X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * FloatingModal — backdrop + a panel that reads like a large index card
 * lifted off the desk. Closes on backdrop click or Escape.
 */
export default function FloatingModal({ open, onClose, title, eyebrow, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-paper-dim border border-paper-line rounded-card
                   shadow-modal p-6 animate-[fadeIn_0.15s_ease-out]"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>
        {eyebrow && (
          <span className="label-tab text-indigo">{eyebrow}</span>
        )}
        {title && <h3 className="font-display text-xl mt-1 mb-5">{title}</h3>}
        <div>{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-paper-line">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
