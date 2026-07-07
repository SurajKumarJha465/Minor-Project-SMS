import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react'
import DashboardShell from '../../../components/layout/DashboardShell.jsx'
import RecordList from '../../../components/ui/RecordList.jsx'
import RecordStrip from '../../../components/ui/RecordStrip.jsx'
import Pill from '../../../components/ui/Pill.jsx'
import Button from '../../../components/ui/Button.jsx'
import Tabs from '../../../components/ui/Tabs.jsx'
import roleConfig from '../../../config/roleConfig.js'
import hodContext from '../../../data/mock/hodContext.js'
import hodSemesters from '../../../data/mock/hodSemesters.js'
import seedStudents from '../../../data/mock/hodStudents.js'
import seedCourses from '../../../data/mock/hodCourses.js'
import teachers from '../../../data/mock/teachers.js'
import StudentFormModal from '../components/StudentFormModal.jsx'
import AssignTeacherModal from '../components/AssignTeacherModal.jsx'

const teacherLookup = Object.fromEntries(teachers.map((t) => [t.teacher_id, t.name]))

export default function SemesterWorkspace() {
  const [selectedSem, setSelectedSem] = useState(
    hodSemesters.find((s) => s.status === 'active')?.sem_number ?? null
  )
  const [tab, setTab] = useState('students')

  const [students, setStudents] = useState(seedStudents)
  const [courses, setCourses] = useState(seedCourses)

  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningCourse, setAssigningCourse] = useState(null)

  const semesterInfo = hodSemesters.find((s) => s.sem_number === selectedSem)

  const semesterStudents = useMemo(
    () => students.filter((s) => s.sem_number === selectedSem),
    [students, selectedSem]
  )
  const semesterCourses = useMemo(
    () => courses.filter((c) => c.sem_number === selectedSem),
    [courses, selectedSem]
  )

  const openAddStudent = () => { setEditingStudent(null); setStudentModalOpen(true) }
  const openEditStudent = (s) => { setEditingStudent(s); setStudentModalOpen(true) }

  const saveStudent = (form) => {
    if (editingStudent) {
      setStudents((list) =>
        list.map((s) => (s.student_id === editingStudent.student_id ? { ...s, ...form } : s))
      )
    } else {
      const nextId = Math.max(0, ...students.map((s) => s.student_id)) + 1
      setStudents((list) => [
        ...list,
        { student_id: nextId, sem_number: selectedSem, ...form, password_hash: '••••••••' }
      ])
    }
    setStudentModalOpen(false)
  }

  const deleteStudent = (id) => setStudents((list) => list.filter((s) => s.student_id !== id))

  const openAssign = (course) => { setAssigningCourse(course); setAssignModalOpen(true) }

  const saveAssignment = (teacherId) => {
    setCourses((list) =>
      list.map((c) =>
        c.course_id === assigningCourse.course_id ? { ...c, assigned_teacher_id: teacherId } : c
      )
    )
    setAssignModalOpen(false)
  }

  return (
    <DashboardShell
      role={roleConfig.hod}
      title="Semester Workspace"
      subtitle="Assign students and manage teacher-course assignments"
      user={hodContext.currentUser}
    >
      {/* Semester picker 1-8 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {hodSemesters.map((s) => {
          const isSelected = s.sem_number === selectedSem
          const isAvailable = s.status === 'active'
          return (
            <button
              key={s.sem_number}
              onClick={() => setSelectedSem(s.sem_number)}
              className={`w-16 h-16 rounded-card border flex flex-col items-center justify-center
                          transition-all
                          ${isSelected
                            ? 'bg-indigo text-white border-indigo shadow-lifted'
                            : isAvailable
                              ? 'bg-white text-ink border-paper-line hover:border-indigo/40'
                              : 'bg-paper-dim text-ink-faint border-paper-line/60'}`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wide opacity-80">Sem</span>
              <span className="font-display text-lg leading-none">{s.sem_number}</span>
            </button>
          )
        })}
      </div>

      {!semesterInfo || semesterInfo.status !== 'active' ? (
        <div className="border border-dashed border-paper-line rounded-card py-14 text-center bg-white/50">
          <p className="font-display text-lg text-ink-soft">
            {selectedSem ? `Semester ${selectedSem} isn't active` : 'Select a semester to begin'}
          </p>
          <p className="text-sm text-ink-faint mt-1">
            {selectedSem
              ? 'No students or courses have been initialized for this semester yet.'
              : 'Pick any semester from 1 to 8 above.'}
          </p>
        </div>
      ) : (
        <>
          <Tabs
            tabs={[
              { key: 'students', label: 'Assign Students', count: semesterStudents.length },
              { key: 'courses', label: 'View Courses', count: semesterCourses.length }
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'students' ? (
            <>
              <div className="flex justify-end mb-4">
                <Button icon={Plus} onClick={openAddStudent}>Assign student</Button>
              </div>
              <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
                <RecordList
                  items={semesterStudents}
                  emptyTitle="No students assigned yet"
                  emptyHint="Use “Assign student” to add the first one to this semester."
                  renderStrip={(s) => (
                    <RecordStrip
                      fields={[
                        { label: 'CRN', value: s.crn, mono: true, tone: 'indigo' },
                        { label: 'NAME', value: s.name },
                        { label: 'EMAIL', value: s.email, mono: true },
                        { label: 'SECTION', value: <Pill tone="neutral">Section {s.section}</Pill> },
                        { label: 'DOB', value: s.dob, mono: true }
                      ]}
                      actions={
                        <>
                          <button
                            onClick={() => openEditStudent(s)}
                            aria-label="Edit student"
                            className="p-2 rounded-[8px] text-ink-faint hover:text-indigo hover:bg-indigo-tint transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteStudent(s.student_id)}
                            aria-label="Remove student"
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
            </>
          ) : (
            <div className="bg-white border border-paper-line rounded-card shadow-card px-4">
              <RecordList
                items={semesterCourses}
                emptyTitle="No courses defined for this semester"
                emptyHint="Courses are set up by the Super Admin under Semesters & Courses."
                renderStrip={(c) => (
                  <RecordStrip
                    fields={[
                      { label: 'COURSE ID', value: `CRS-${String(c.course_id).padStart(3, '0')}`, mono: true, tone: 'indigo' },
                      { label: 'COURSE NAME', value: c.course_name },
                      { label: 'CODE', value: c.course_code, mono: true },
                      { label: 'CREDIT HRS', value: c.credit_hrs, mono: true },
                      {
                        label: 'ASSIGNED TEACHER',
                        value: c.assigned_teacher_id
                          ? teacherLookup[c.assigned_teacher_id]
                          : <Pill tone="amber">Unassigned</Pill>
                      }
                    ]}
                    actions={
                      <Button size="sm" variant="outline" icon={UserCog} onClick={() => openAssign(c)}>
                        Assign teacher
                      </Button>
                    }
                  />
                )}
              />
            </div>
          )}
        </>
      )}

      <StudentFormModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSave={saveStudent}
        initial={editingStudent}
        sections={semesterInfo?.sections?.length ? semesterInfo.sections : ['A']}
      />
      <AssignTeacherModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSave={saveAssignment}
        course={assigningCourse}
      />
    </DashboardShell>
  )
}