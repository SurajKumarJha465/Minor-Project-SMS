import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'
import departments from '../../../data/mock/departments.js'

const emptyForm = { sem_number: '', academic_year: '', department: departments[0]?.department_name || '', status: 'draft' }

export default function SemesterFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyForm)
  }, [initial, open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.sem_number || !form.academic_year.trim()) return
    onSave(form)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow={initial ? 'Edit record' : 'New record'}
      title={initial ? 'Edit Semester' : 'Add Semester'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>
            {initial ? 'Save changes' : 'Add semester'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-tab block mb-1.5">SEMESTER NO.</label>
            <input
              type="number"
              min="1"
              max="8"
              value={form.sem_number}
              onChange={set('sem_number')}
              placeholder="e.g. 5"
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            />
          </div>
          <div>
            <label className="label-tab block mb-1.5">ACADEMIC YEAR</label>
            <input
              value={form.academic_year}
              onChange={set('academic_year')}
              placeholder="2025-2026"
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            />
          </div>
        </div>
        <div>
          <label className="label-tab block mb-1.5">DEPARTMENT</label>
          <select
            value={form.department}
            onChange={set('department')}
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          >
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
            ))}
          </select>
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
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </FloatingModal>
  )
}
