// assigned_teacher_id is null until the HOD assigns someone via the
// "Assign Teacher" action on the Courses tab.
const hodCourses = [
  { course_id: 1, course_name: 'Database Management Systems', course_code: 'CT501', credit_hrs: 3, sem_number: 5, assigned_teacher_id: 1 },
  { course_id: 2, course_name: 'Operating Systems', course_code: 'CT502', credit_hrs: 3, sem_number: 5, assigned_teacher_id: null },
  { course_id: 3, course_name: 'Object Oriented Programming', course_code: 'CT303', credit_hrs: 3, sem_number: 3, assigned_teacher_id: 2 },
  { course_id: 4, course_name: 'Discrete Structures', course_code: 'CT304', credit_hrs: 3, sem_number: 3, assigned_teacher_id: null }
]

export default hodCourses