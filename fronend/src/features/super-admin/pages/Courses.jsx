import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import Button from '../../../components/ui/Button.jsx'
import SearchInput from '../../../components/ui/SearchInput.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import roleConfig from '../../../config/roleConfig.js'
import userStats from '../../../data/mock/users.js'
import seedSemesters from '../../../data/mock/semesters.js'
import seedCourses from '../../../data/mock/courses.js'
import SemesterFormModal from '../components/SemesterFormModal.jsx'
import CourseFormModal from '../components/CourseFormModal.jsx'

export default function Courses() {
  const [tab, setTab] = useState('semesters')
  const [semesters, setSemesters] = useState(seedSemesters)
  const [courses, setCourses] = useState(seedCourses)
  const [query, setQuery] = useState('')

  const [semModalOpen, setSemModalOpen] = useState(false)
  const [editingSem, setEditingSem] = useState(null)
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)

  const semesterLookup = useMemo(
    () => Object.fromEntries(semesters.map((s) => [s.semester_id, s])),
    [semesters]
  )

  const filteredSemesters = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return semesters
    return semesters.filter(
      (s) => s.department.toLowerCase().includes(q) || s.academic_year.includes(q)
    )
  }, [semesters, query])

  const filteredCourses = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) => c.course_name.toLowerCase().includes(q) || c.course_code.toLowerCase().includes(q)
    )
  }, [courses, query])

  const saveSemester = (form) => {
    if (editingSem) {
      setSemesters((list) =>
        list.map((s) => (s.semester_id === editingSem.semester_id ? { ...s, ...form, sem_number: Number(form.sem_number) } : s))
      )
    } else {
      const nextId = Math.max(0, ...semesters.map((s) => s.semester_id)) + 1
      setSemesters((list) => [...list, { semester_id: nextId, ...form, sem_number: Number(form.sem_number) }])
    }
    setSemModalOpen(false)
  }

  const saveCourse = (form) => {
    if (editingCourse) {
      setCourses((list) =>
        list.map((c) => (c.course_id === editingCourse.course_id ? { ...c, ...form, credit_hrs: Number(form.credit_hrs) } : c))
      )
    } else {
      const nextId = Math.max(0, ...courses.map((c) => c.course_id)) + 1
      setCourses((list) => [...list, { course_id: nextId, ...form, credit_hrs: Number(form.credit_hrs) }])
    }
    setCourseModalOpen(false)
  }

  return (
    <DashboardShell
      role={roleConfig.superAdmin}
      title="Semesters & Courses"
      subtitle="Academic structure by department"
      user={userStats.currentUser}
      actions={
        tab === 'semesters' ? (
          <Button icon={Plus} onClick={() => { setEditingSem(null); setSemModalOpen(true) }}>
            Add semester
          </Button>
        ) : (
          <Button icon={Plus} onClick={() => { setEditingCourse(null); setCourseModalOpen(true) }}>
            Add course
          </Button>
        )
      }
    >
      <Tabs
        tabs={[
          { key: 'semesters', label: 'Semesters', count: semesters.length },
          { key: 'courses', label: 'Courses', count: courses.length }
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-5 max-w-xs">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={tab === 'semesters' ? 'Search department or year…' : 'Search course name or code…'}
        />
      </div>

      <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
        {tab === 'semesters' ? (
          <RecordList
            items={filteredSemesters}
            emptyTitle="No semesters match your search"
            emptyHint="Try a different department or academic year."
            renderStrip={(s) => (
              <RecordStrip
                fields={[
                  { label: 'SEM ID', value: `SEM-${String(s.semester_id).padStart(2, '0')}`, mono: true, tone: 'indigo' },
                  { label: 'SEMESTER', value: `Semester ${s.sem_number}` },
                  { label: 'ACADEMIC YEAR', value: s.academic_year, mono: true },
                  { label: 'DEPARTMENT', value: s.department },
                  { label: 'STATUS', value: <Pill>{s.status}</Pill> }
                ]}
                actions={
                  <>
                    <button
                      onClick={() => { setEditingSem(s); setSemModalOpen(true) }}
                      aria-label="Edit semester"
                      className="p-2 rounded-[8px] text-ink-faint hover:text-indigo hover:bg-indigo-tint transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setSemesters((list) => list.filter((x) => x.semester_id !== s.semester_id))}
                      aria-label="Delete semester"
                      className="p-2 rounded-[8px] text-ink-faint hover:text-brick hover:bg-brick-tint transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                }
              />
            )}
          />
        ) : (
          <RecordList
            items={filteredCourses}
            emptyTitle="No courses match your search"
            emptyHint="Try a different name or course code."
            renderStrip={(c) => {
              const sem = semesterLookup[c.semester_id]
              return (
                <RecordStrip
                  fields={[
                    { label: 'COURSE ID', value: `CRS-${String(c.course_id).padStart(3, '0')}`, mono: true, tone: 'indigo' },
                    { label: 'COURSE NAME', value: c.course_name },
                    { label: 'CODE', value: c.course_code, mono: true },
                    { label: 'CREDIT HRS', value: c.credit_hrs, mono: true },
                    { label: 'SEMESTER', value: sem ? `Sem ${sem.sem_number} · ${sem.department}` : '—' }
                  ]}
                  actions={
                    <>
                      <button
                        onClick={() => { setEditingCourse(c); setCourseModalOpen(true) }}
                        aria-label="Edit course"
                        className="p-2 rounded-[8px] text-ink-faint hover:text-indigo hover:bg-indigo-tint transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setCourses((list) => list.filter((x) => x.course_id !== c.course_id))}
                        aria-label="Delete course"
                        className="p-2 rounded-[8px] text-ink-faint hover:text-brick hover:bg-brick-tint transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  }
                />
              )
            }}
          />
        )}
      </div>

      <SemesterFormModal
        open={semModalOpen}
        onClose={() => setSemModalOpen(false)}
        onSave={saveSemester}
        initial={editingSem}
      />
      <CourseFormModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSave={saveCourse}
        initial={editingCourse}
      />
    </DashboardShell>
  )
}
