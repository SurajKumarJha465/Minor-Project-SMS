import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'
import { roles } from '../../../data/mock/usersList.js'

const emptyForm = { name: '', email: '', role: 'Teacher', status: 'pending' }

export default function UserFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyForm)
  }, [initial, open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return
    onSave(form)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow={initial ? 'Edit record' : 'New record'}
      title={initial ? 'Edit Teacher / HOD' : 'Add Teacher or HOD'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>
            {initial ? 'Save changes' : 'Add account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-tab block mb-1.5">FULL NAME</label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Mina Gurung"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div>
          <label className="label-tab block mb-1.5">EMAIL</label>
          <input
            value={form.email}
            onChange={set('email')}
            placeholder="name@sms.edu"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-tab block mb-1.5">ACCOUNT TYPE</label>
            <div className="flex gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors
                              ${form.role === r
                                ? 'bg-indigo text-white border-indigo'
                                : 'bg-white text-ink-soft border-paper-line hover:border-indigo/40'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-tab block mb-1.5">STATUS</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            >
              <option value="active">Unassigned</option>
              <option value="pending">Assigned</option>
            </select>
          </div>
        </div>
      </div>
    </FloatingModal>
  )
}