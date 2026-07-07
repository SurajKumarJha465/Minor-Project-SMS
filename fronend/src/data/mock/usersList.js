// Super Admin's privilege here is limited to creating/managing Teacher and HOD
// accounts. Students are never created or edited from this list — they're
// looked up read-only on the Students page, filtered by Department + Semester.
const roles = ['HOD', 'Teacher']

const usersList = [
  { user_id: 2, name: 'Dr. Aarav Shah', email: 'aarav.shah@sms.edu', role: 'HOD', status: 'active' },
  { user_id: 3, name: 'Dr. Priya Karki', email: 'priya.karki@sms.edu', role: 'HOD', status: 'active' },
  { user_id: 4, name: 'Bikash Thapa', email: 'bikash.thapa@sms.edu', role: 'Teacher', status: 'active' },
  { user_id: 5, name: 'Mina Gurung', email: 'mina.gurung@sms.edu', role: 'Teacher', status: 'active' },
  { user_id: 6, name: 'Rohit Malla', email: 'rohit.malla@sms.edu', role: 'Teacher', status: 'suspended' }
]

export { roles }
export default usersList