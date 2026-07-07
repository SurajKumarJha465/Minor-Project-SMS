// Read-only roster. Super Admin never adds/edits a student here — this exists
// purely so a department + semester can be selected to see who's enrolled.
const students = [
  { student_id: 1, name: 'Sabin Adhikari', enrollment_no: 'CT075BCT012', department: 'Computer Engineering', sem_number: 5, status: 'active' },
  { student_id: 2, name: 'Nisha Lama', enrollment_no: 'CT075BCT034', department: 'Computer Engineering', sem_number: 5, status: 'active' },
  { student_id: 3, name: 'Aayush Basnet', enrollment_no: 'CT075BCT018', department: 'Computer Engineering', sem_number: 5, status: 'active' },
  { student_id: 4, name: 'Manish Tamang', enrollment_no: 'CT076BCT041', department: 'Computer Engineering', sem_number: 3, status: 'active' },
  { student_id: 5, name: 'Kiran Bhattarai', enrollment_no: 'CE076BCE009', department: 'Civil Engineering', sem_number: 3, status: 'active' },
  { student_id: 6, name: 'Sneha Rai', enrollment_no: 'EC074BEC021', department: 'Electronics & Communication', sem_number: 7, status: 'active' },
  { student_id: 7, name: 'Prakash Neupane', enrollment_no: 'AR077BAR004', department: 'Architecture', sem_number: 1, status: 'pending' }
]

export default students