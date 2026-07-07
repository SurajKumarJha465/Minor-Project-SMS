import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'

const emptyForm = { crn: '', name: '', email: '', password: '', section: '', dob: '' }

export default function StudentFormModal({ open, onClose, onSave, initial, sections }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initial) {
      setForm({ ...emptyForm, ...initial, password: '' })
    } else {
      setForm({ ...emptyForm, section: sections[0] || '' })
    }
  }, [initial, open, sections])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.crn.trim() || !form.name.trim() || !form.email.trim() || !form.section) return
    if (!initial && !form.password.trim()) return
    onSave(form)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow={initial ? 'Edit record' : 'New record'}
      title={initial ? 'Edit Student' : 'Assign Student'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>
            {initial ? 'Save changes' : 'Assign student'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-tab block mb-1.5">CRN</label>
            <input
              value={form.crn}
              onChange={set('crn')}
              placeholder="CT075BCT012"
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm font-mono outline-none focus:border-indigo/50"
            />
          </div>
          <div>
            <label className="label-tab block mb-1.5">SECTION</label>
            <select
              value={form.section}
              onChange={set('section')}
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            >
              {sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-tab block mb-1.5">FULL NAME</label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Sabin Adhikari"
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
            <label className="label-tab block mb-1.5">
              {initial ? 'NEW PASSWORD (optional)' : 'PASSWORD'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={initial ? 'Leave blank to keep current' : 'Set an initial password'}
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            />
          </div>
          <div>
            <label className="label-tab block mb-1.5">DOB</label>
            <input
              type="date"
              value={form.dob}
              onChange={set('dob')}
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            />
          </div>
        </div>
      </div>
    </FloatingModal>
  )
}