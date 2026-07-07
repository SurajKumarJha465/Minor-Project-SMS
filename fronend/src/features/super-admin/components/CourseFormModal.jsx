import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'
import semesters from '../../../data/mock/semesters.js'

const emptyForm = {
  course_name: '',
  course_code: '',
  credit_hrs: '',
  semester_id: semesters[0]?.semester_id ?? ''
}

export default function CourseFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyForm)
  }, [initial, open])

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: key === 'semester_id' ? Number(e.target.value) : e.target.value
    }))

  const handleSave = () => {
    if (!form.course_name.trim() || !form.course_code.trim()) return
    onSave(form)
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow={initial ? 'Edit record' : 'New record'}
      title={initial ? 'Edit Course' : 'Add Course'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>
            {initial ? 'Save changes' : 'Add course'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-tab block mb-1.5">COURSE NAME</label>
          <input
            value={form.course_name}
            onChange={set('course_name')}
            placeholder="e.g. Database Management Systems"
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-tab block mb-1.5">COURSE CODE</label>
            <input
              value={form.course_code}
              onChange={set('course_code')}
              placeholder="CT501"
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm font-mono outline-none focus:border-indigo/50"
            />
          </div>
          <div>
            <label className="label-tab block mb-1.5">CREDIT HOURS</label>
            <input
              type="number"
              min="1"
              max="6"
              value={form.credit_hrs}
              onChange={set('credit_hrs')}
              placeholder="3"
              className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                         text-sm outline-none focus:border-indigo/50"
            />
          </div>
        </div>
        <div>
          <label className="label-tab block mb-1.5">SEMESTER</label>
          <select
            value={form.semester_id}
            onChange={set('semester_id')}
            className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                       text-sm outline-none focus:border-indigo/50"
          >
            {semesters.map((s) => (
              <option key={s.semester_id} value={s.semester_id}>
                Sem {s.sem_number} — {s.department} ({s.academic_year})
              </option>
            ))}
          </select>
        </div>
      </div>
    </FloatingModal>
  )
}
