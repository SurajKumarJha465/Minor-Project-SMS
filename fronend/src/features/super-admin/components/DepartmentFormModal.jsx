import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'

const emptyForm = { department_name: '', hod_name: '', status: 'pending' }

export default function DepartmentFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyForm)
  }, [initial, open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.department_name.trim()) return
    onSave(form)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow={initial ? 'Edit record' : 'New record'}
      title={initial ? 'Edit Department' : 'Add Department'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>
            {initial ? 'Save changes' : 'Add department'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-tab block mb-1.5">DEPARTMENT NAME</label>
          <input
            value={form.department_name}
            onChange={set('department_name')}
            placeholder="e.g. Computer Engineering"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div>
          <label className="label-tab block mb-1.5">HEAD OF DEPARTMENT</label>
          <input
            value={form.hod_name}
            onChange={set('hod_name')}
            placeholder="Assign later if unsure"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div>
          <label className="label-tab block mb-1.5">STATUS</label>
          <select
            value={form.status}
            onChange={set('status')}
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </FloatingModal>
  )
}
