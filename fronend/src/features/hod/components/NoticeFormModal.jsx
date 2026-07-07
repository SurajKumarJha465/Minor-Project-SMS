import { useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'

const empty = { title: '', body: '' }

export default function NoticeFormModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(empty)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave(form)
    setForm(empty)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow="New notice"
      title="Post a Notice"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>Post notice</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-tab block mb-1.5">TITLE</label>
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Internal exam schedule released"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div>
          <label className="label-tab block mb-1.5">DETAILS</label>
          <textarea
            value={form.body}
            onChange={set('body')}
            rows={4}
            placeholder="Keep it short — this is a plain announcement, not a document."
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50 resize-none"
          />
        </div>
      </div>
    </FloatingModal>
  )
}