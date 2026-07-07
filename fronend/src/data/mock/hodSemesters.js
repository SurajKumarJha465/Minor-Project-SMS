// The HOD only ever sees their own department's semesters (Computer Engineering).
// Not every semester number 1-8 necessarily has an active batch running —
// those show as "not initialized" on the Semester workspace picker.
const hodSemesters = [
  { sem_number: 1, academic_year: '2026-2027', status: 'draft', sections: ['A'], total_students: 0, total_courses: 0 },
  { sem_number: 2, academic_year: '2025-2026', status: 'inactive', sections: [], total_students: 0, total_courses: 0 },
  { sem_number: 3, academic_year: '2025-2026', status: 'active', sections: ['A', 'B'], total_students: 58, total_courses: 2 },
  { sem_number: 4, academic_year: '2025-2026', status: 'inactive', sections: [], total_students: 0, total_courses: 0 },
  { sem_number: 5, academic_year: '2025-2026', status: 'active', sections: ['A', 'B'], total_students: 61, total_courses: 2 },
  { sem_number: 6, academic_year: '2025-2026', status: 'inactive', sections: [], total_students: 0, total_courses: 0 },
  { sem_number: 7, academic_year: '2025-2026', status: 'inactive', sections: [], total_students: 0, total_courses: 0 },
  { sem_number: 8, academic_year: '2024-2025', status: 'inactive', sections: [], total_students: 0, total_courses: 0 }
]

export default hodSemesters