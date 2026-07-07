import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import Button from '../../../components/ui/Button.jsx'
import SearchInput from '../../../components/ui/SearchInput.jsx'
import roleConfig from '../../../config/roleConfig.js'
import userStats from '../../../data/mock/users.js'
import seedUsers, { roles } from '../../../data/mock/usersList.js'
import UserFormModal from '../components/UserFormModal.jsx'

const ROLE_TONE = {
  HOD: 'indigo',
  Teacher: 'sage'
}

export default function Users() {
  const [users, setUsers] = useState(seedUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'All' || u.role === roleFilter
      const q = query.toLowerCase()
      const matchesQuery =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      return matchesRole && matchesQuery
    })
  }, [users, query, roleFilter])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setModalOpen(true)
  }

  const handleSave = (form) => {
    if (editing) {
      setUsers((list) => list.map((u) => (u.user_id === editing.user_id ? { ...u, ...form } : u)))
    } else {
      const nextId = Math.max(0, ...users.map((u) => u.user_id)) + 1
      setUsers((list) => [...list, { user_id: nextId, ...form }])
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => setUsers((list) => list.filter((u) => u.user_id !== id))

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
     title="Teachers & HODs"
     subtitle={`${users.length} staff account${users.length === 1 ? '' : 's'} — Teacher / HOD only`}
     user={userStats.currentUser}
     actions={<Button icon={Plus} onClick={openCreate}>Add teacher</Button>}
    >
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name or email…" className="max-w-xs" />
        <div className="flex gap-1.5">
          {['All', ...roles].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wide
                          transition-colors border
                          ${roleFilter === r
                            ? 'bg-indigo text-white border-indigo'
                            : 'bg-white text-ink-faint border-paper-line hover:border-indigo/40'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        <RecordList
          items={filtered}
          emptyTitle="No users match this filter"
          emptyHint="Try a different role filter or search term."
          renderStrip={(u) => (
            <RecordStrip
              fields={[
                { label: 'USER ID', value: `USR-${String(u.user_id).padStart(3, '0')}`, mono: true, tone: 'indigo' },
                { label: 'NAME', value: u.name },
                { label: 'EMAIL', value: u.email, mono: true },
                { label: 'ROLE', value: <Pill tone={ROLE_TONE[u.role]}>{u.role}</Pill> },
                { label: 'STATUS', value: <Pill>{u.status}</Pill> }
              ]}
              actions={
                <>
                  <button
                    onClick={() => openEdit(u)}
                    aria-label="Edit user"
                    className="p-2 rounded-[8px] text-ink-faint hover:text-indigo hover:bg-indigo-tint transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.user_id)}
                    aria-label="Remove user"
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

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </DashboardShell>
  )
}
