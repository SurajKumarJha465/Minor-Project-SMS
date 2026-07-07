import { useEffect, useState } from 'react'
import FloatingModal from '../../../components/ui/FloatingModal.jsx'
import Button from '../../../components/ui/Button.jsx'
import teachers from '../../../data/mock/teachers.js'

export default function AssignTeacherModal({ open, onClose, onSave, course }) {
  const [teacherId, setTeacherId] = useState('')

  useEffect(() => {
    setTeacherId(course?.assigned_teacher_id ?? '')
  }, [course, open])

  const handleSave = () => {
    onSave(teacherId === '' ? null : Number(teacherId))
  }

  return (
    <FloatingModal
      open={open}
      onClose={onClose}
      eyebrow="Assign teacher"
      title={course ? `${course.course_name} (${course.course_code})` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleSave}>Save assignment</Button>
        </>
      }
    >
      <label className="label-tab block mb-1.5">TEACHER</label>
      <select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="w-full bg-white border border-paper-line rounded-[8px] px-3 py-2
                   text-sm outline-none focus:border-indigo/50"
      >
        <option value="">— Unassigned —</option>
        {teachers
          .filter((t) => t.status === 'active')
          .map((t) => (
            <option key={t.teacher_id} value={t.teacher_id}>
              {t.name} — {t.specialization}
            </option>
          ))}
      </select>
      <p className="text-xs text-ink-faint mt-2">
        Only active teachers in your department are listed. Suspended teachers must be
        reactivated before they can be assigned.
      </p>
    </FloatingModal>
  )
}