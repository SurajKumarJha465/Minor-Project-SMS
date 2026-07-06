import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import Button from '../../../components/ui/Button.jsx'
import SearchInput from '../../../components/ui/SearchInput.jsx'
import roleConfig from '../../../config/roleConfig.js'
import users from '../../../data/mock/users.js'
import seedDepartments from '../../../data/mock/departments.js'
import DepartmentFormModal from '../components/DepartmentFormModal.jsx'

export default function Departments() {
  const [departments, setDepartments] = useState(seedDepartments)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return departments
    const q = query.toLowerCase()
    return departments.filter(
      (d) =>
        d.department_name.toLowerCase().includes(q) ||
        d.hod_name.toLowerCase().includes(q)
    )
  }, [departments, query])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (dept) => {
    setEditing(dept)
    setModalOpen(true)
  }

  const handleSave = (form) => {
    if (editing) {
      setDepartments((list) =>
        list.map((d) => (d.department_id === editing.department_id ? { ...d, ...form } : d))
      )
    } else {
      const nextId = Math.max(0, ...departments.map((d) => d.department_id)) + 1
      setDepartments((list) => [
        ...list,
        { department_id: nextId, total_teachers: 0, total_students: 0, ...form }
      ])
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    setDepartments((list) => list.filter((d) => d.department_id !== id))
  }

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Departments"
      subtitle={`${departments.length} departments on record`}
      user={users.currentUser}
      actions={
        <Button icon={Plus} onClick={openCreate}>Add department</Button>
      }
    >
      <div className="mb-5 max-w-xs">
        <SearchInput value={query} onChange={setQuery} placeholder="Search department or HOD…" />
      </div>

      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        <RecordList
          items={filtered}
          emptyTitle="No departments match your search"
          emptyHint="Try a different name, or clear the search field."
          renderStrip={(d) => (
            <RecordStrip
              fields={[
                { label: 'DEPT ID', value: `DEPT-${String(d.department_id).padStart(2, '0')}`, mono: true, tone: 'indigo' },
                { label: 'DEPARTMENT NAME', value: d.department_name },
                { label: 'HEAD OF DEPARTMENT', value: d.hod_name },
                { label: 'TEACHERS', value: d.total_teachers, mono: true },
                { label: 'STUDENTS', value: d.total_students, mono: true },
                { label: 'STATUS', value: <Pill>{d.status}</Pill> }
              ]}
              actions={
                <>
                  <button
                    onClick={() => openEdit(d)}
                    aria-label="Edit department"
                    className="p-2 rounded-[8px] text-ink-faint hover:text-indigo hover:bg-indigo-tint transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.department_id)}
                    aria-label="Delete department"
                    className="p-2 rounded-[8px] text-ink-faint hover:text-brick hover:bg-brick-tint transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              }
            />
          )}
        />
      </div>

      <DepartmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </DashboardShell>
  )
}
