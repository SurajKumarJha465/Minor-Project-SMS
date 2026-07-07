import { useState } from 'react'
import { Plus, Trash2, Megaphone } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import Button from '../../../components/ui/Button.jsx'
import roleConfig from '../../../config/roleConfig.js'
import hodContext from '../../../data/mock/hodContext.js'
import seedNotices from '../../../data/mock/notices.js'
import NoticeFormModal from '../components/NoticeFormModal.jsx'

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Notices() {
  const [notices, setNotices] = useState(seedNotices)
  const [modalOpen, setModalOpen] = useState(false)

  const addNotice = (form) => {
    const nextId = Math.max(0, ...notices.map((n) => n.notice_id)) + 1
    setNotices((list) => [{ notice_id: nextId, date: todayISO(), ...form }, ...list])
    setModalOpen(false)
  }

  const removeNotice = (id) => setNotices((list) => list.filter((n) => n.notice_id !== id))

  return (
    <DashboardShell
      role={roleConfig.hod}
      title="Notices"
      subtitle="Quick announcements for your department"
      user={hodContext.currentUser}
      actions={<Button icon={Plus} onClick={() => setModalOpen(true)}>Post notice</Button>}
    >
      {!notices.length ? (
        <div className="border border-dashed border-paper-line rounded-card py-14 text-center bg-white/50">
          <p className="font-display text-lg text-ink-soft">No notices posted</p>
          <p className="text-sm text-ink-faint mt-1">Post one to let your department know what's happening.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.notice_id}
              className="bg-white border border-paper-line rounded-card shadow-card p-4 flex items-start justify-between gap-4"
            >
              <div className="flex gap-3">
                <Megaphone size={16} className="text-indigo mt-1 shrink-0" />
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-display text-base">{n.title}</h3>
                    <span className="font-mono text-[11px] text-ink-faint">{n.date}</span>
                  </div>
                  {n.body && <p className="text-sm text-ink-soft mt-1 leading-relaxed">{n.body}</p>}
                </div>
              </div>
              <button
                onClick={() => removeNotice(n.notice_id)}
                aria-label="Delete notice"
                className="p-2 rounded-[8px] text-ink-faint hover:text-brick hover:bg-brick-tint transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <NoticeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addNotice}
      />
    </DashboardShell>
  )
}