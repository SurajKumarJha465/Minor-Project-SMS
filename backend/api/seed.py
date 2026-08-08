"""
Seed script — Information Technology department, real roster.

Source: IT_Student_Record.xlsx (BEIT 2023/2024/2025 intakes), reconciled
against the college's live enrollment-year -> semester mapping:
    2023 intake -> semester 6
    2024 intake -> semester 4
    2025 intake -> semester 2
(each intake year is 2 semesters behind the one before it)

Sections m1/m2/d were derived from each CRN's own digit pattern rather than
the spreadsheet's column layout, since 6 rows in the source sheet were filed
under the wrong section header. 18 students had no entry in the emails sheet
(added to the roster after it was compiled) and were given a generated
firstname.CRN@ncit.edu.np address to match the college's own convention.

Only 14 students currently have enrollment photos for face-recognition
attendance (see PHOTO_ENROLLED_CRNS below) — everyone else gets a full
student + login record with photo=None; the frontend's placeholder avatar
and the attendance recognizer's "not enrolled in known_embeddings" path
both already handle that.

Teachers and courses (below the student block) come from the same
department roster, "Name of Faculty" column, BEIT Spring 2026 — restricted
to semesters II/IV/VI since those are the only ones with a seeded student
roster. Only teacher names and the course-per-semester list were available
(confidentiality); course codes, credits, section splits, and every
teacher's contact/profile fields beyond their name are invented to fill
out the schema, following the numbering and title conventions visible in
the wider Pokhara University curriculum (see COURSE_TEMPLATES/TEACHERS
comments below for specifics). Where the roster listed more than one name
for a course ("Deepak Raj Aryal/Purna Pd Sharma"), that's the college's
shorthand for "different sections, different teachers" — split across
m1/m2/d rather than treated as co-teaching, since one teacher can cover
multiple sections but a Course row only ever has one teacher_id.

This is a single-department showcase (IT only), so every legacy "ce"
placeholder row and every @ssms.edu demo login (admin/hod/teacher/student)
is retired below rather than preserved. There is exactly one non-personal
login left after this runs: ADMIN_EMAIL. Everyone else — students,
teachers, and the HOD — gets their own real ncit.edu.np account. Mahesh
Neupane is both a teaching faculty member (see TEACHERS/COURSE_TEMPLATES)
and the department HOD; since one User row = one role (see RoleEnum +
require_role), he ends up with two logins for two dashboards: his personal
teacher address, and the role-based HOD_EMAIL mailbox below. That mirrors
how the college itself would issue accounts (a person keeps their personal
address for their personal role, and the office/role gets its own mailbox
when the same person also holds it), not a case of one person having two
personal emails.
"""
import os
from api.database import SessionLocal, engine, Base
from api.models import (
    Department, Section, Course, Student, Enrollment, User, RoleEnum,
    AttendanceRecord, InternalMark, Teacher, HOD, Admin,
)
from api.auth import hash_password

Base.metadata.create_all(bind=engine)

DEPARTMENT_ID = "information-technology"
DEPARTMENT_NAME = "Information Technology"
DEPARTMENT_CODE = "IT"

SECTIONS = [("m1", "M1"), ("m2", "M2"), ("d", "Day")]

# Default password for every seeded student login (dev/demo only — real
# accounts get must_change_password=True so this is a first-login-only value).
DEFAULT_STUDENT_PASSWORD = "student123"

# (crn, name, semester, section_id, email)
IT_STUDENTS = [
    ("251401", "Aakriti Ramdam", 2, "m1", "aakriti.251401@ncit.edu.np"),
    ("251402", "Aananta Gautam", 2, "m1", "aananta.251402@ncit.edu.np"),
    ("251403", "Aashirwad Pandey", 2, "m1", "aashirwad.251403@ncit.edu.np"),
    ("251404", "Aayush Katuwal", 2, "m1", "aayush.251404@ncit.edu.np"),
    ("251405", "Abhash Kumar Yadav", 2, "m1", "abhash.251405@ncit.edu.np"),
    ("251406", "Abhishek Adhikari", 2, "m1", "abhishek.251406@ncit.edu.np"),
    ("251407", "Amit Yadav", 2, "m1", "amit.251407@ncit.edu.np"),
    ("251409", "Anuska Yadav", 2, "m1", "anuska.251409@ncit.edu.np"),
    ("251410", "Asbin Rai", 2, "m1", "asbin.251410@ncit.edu.np"),
    ("251411", "Ataldeep Baniya", 2, "m1", "ataldeep.251411@ncit.edu.np"),
    ("251412", "Bibek Kumar Thakur", 2, "m1", "bibek.251412@ncit.edu.np"),
    ("251413", "Bimala Yadav", 2, "m1", "bimala.251413@ncit.edu.np"),
    ("251414", "Biplob Shakya", 2, "m1", "biplob.251414@ncit.edu.np"),
    ("251416", "Dilip Prasad Chaurasiya", 2, "m1", "dilip.251416@ncit.edu.np"),
    ("251417", "Ishan Banjade", 2, "m1", "ishan.251417@ncit.edu.np"),
    ("251418", "Kamal Thapa", 2, "m1", "kamal.251418@ncit.edu.np"),
    ("251419", "Krish Joshi", 2, "m1", "krish.251419@ncit.edu.np"),
    ("251420", "Laxmi Kumari B.K", 2, "m1", "laxmi.251420@ncit.edu.np"),
    ("251421", "Madhbi Sah", 2, "m1", "madhbi.251421@ncit.edu.np"),
    ("251422", "Manas Bariyat", 2, "m1", "manas.251422@ncit.edu.np"),
    ("251423", "Mohammad Shahid", 2, "m1", "mohammad.251423@ncit.edu.np"),
    ("251424", "Nebin Yadav", 2, "m1", "nebin.251424@ncit.edu.np"),
    ("251426", "Pranab Raj Shrestha", 2, "m1", "pranab.251426@ncit.edu.np"),
    ("251427", "Prashamsa Yadav", 2, "m1", "prashamsa.251427@ncit.edu.np"),
    ("251428", "Prince Mehta", 2, "m1", "prince.251428@ncit.edu.np"),
    ("251430", "Raj Rohita", 2, "m1", "raj.251430@ncit.edu.np"),
    ("251431", "Raja Kumar Sah", 2, "m1", "raja.251431@ncit.edu.np"),
    ("251432", "Ravi Shankar Prasad Yadav", 2, "m1", "ravi.251432@ncit.edu.np"),
    ("251433", "Reva Shrestha", 2, "m1", "reva.251433@ncit.edu.np"),
    ("251434", "Rohit Dhami", 2, "m1", "rohit.251434@ncit.edu.np"),
    ("251435", "Sajan Kumar Sah", 2, "m1", "sajan.251435@ncit.edu.np"),
    ("251436", "Sakshyam Sapkota", 2, "m1", "sakshyam.251436@ncit.edu.np"),
    ("251437", "Samanata Mainali", 2, "m1", "samanata.251437@ncit.edu.np"),
    ("251438", "Samikshya Shahu", 2, "m1", "samikshya.251438@ncit.edu.np"),
    ("251440", "Shashikant Yadav", 2, "m1", "shashikant.251440@ncit.edu.np"),
    ("251441", "Shiv Shankar Yadav", 2, "m1", "shiv.251441@ncit.edu.np"),
    ("251442", "Shivam Singh", 2, "m1", "shivam.251442@ncit.edu.np"),
    ("251443", "Sparsh R.C", 2, "m1", "sparsh.251443@ncit.edu.np"),
    ("251444", "Susant Singh", 2, "m1", "susant.251444@ncit.edu.np"),
    ("251445", "Sushant Basnet", 2, "m1", "sushant.251445@ncit.edu.np"),
    ("251446", "Sushil Kumar Mahato", 2, "m1", "sushil.251446@ncit.edu.np"),
    ("251447", "Susmita Guvaju", 2, "m1", "susmita.251447@ncit.edu.np"),
    ("251448", "Yamon Paudel", 2, "m1", "yaman.251448@ncit.edu.np"),
    ("251449", "Nikhil Adhikari", 2, "m1", "nikhil.251449@ncit.edu.np"),
    ("251450", "Roshan Chaudhary", 2, "m1", "roshan.251450@ncit.edu.np"),
    ("251451", "Vishnu Yadav", 2, "m1", "vishnu.251451@ncit.edu.np"),
    ("254101", "Aaradhya Pandit", 2, "m2", "aaradhya.254101@ncit.edu.np"),
    ("254102", "Aashutosh Rijal", 2, "m2", "aashutosh.254102@ncit.edu.np"),
    ("254103", "Aatish Kumar Yadav", 2, "m2", "aatish.254103@ncit.edu.np"),
    ("254105", "Abaya Rijal", 2, "m2", "abaya.254105@ncit.edu.np"),
    ("254106", "Aditya Regmi", 2, "m2", "aditya.254106@ncit.edu.np"),
    ("254108", "Anshu Joshi", 2, "m2", "anshu.254108@ncit.edu.np"),
    ("254109", "Bhanu Bhakta Karki", 2, "m2", "bhanu.254109@ncit.edu.np"),
    ("254110", "Bhumika Khadka", 2, "m2", "bhumika.254110@ncit.edu.np"),
    ("254111", "Bibek Kumar Yadav", 2, "m2", "bibek.254111@ncit.edu.np"),
    ("254112", "Deevash Kumar Pathak", 2, "m2", "deevash.254112@ncit.edu.np"),
    ("254113", "Demisha Dahal", 2, "m2", "demisha.254113@ncit.edu.np"),
    ("254114", "Jenisha Baniya", 2, "m2", "jenisha.254114@ncit.edu.np"),
    ("254115", "Jiban Sah", 2, "m2", "jiban.254115@ncit.edu.np"),
    ("254116", "Julfukar Ali Zafar", 2, "m2", "julfukar.254116@ncit.edu.np"),
    ("254117", "Khemraj Timilsina", 2, "m2", "khemraj.254117@ncit.edu.np"),
    ("254118", "Kshitij Kumar Chaudhary", 2, "m2", "kshitij.254118@ncit.edu.np"),
    ("254119", "Manish Prasad Sah", 2, "m2", "manish.254119@ncit.edu.np"),
    ("254120", "Nebdihang Rai", 2, "m2", "nebdihang.254120@ncit.edu.np"),
    ("254121", "Nisham Gurmachhan", 2, "m2", "nisham.254121@ncit.edu.np"),
    ("254122", "Prabodh Adhikari", 2, "m2", "prabodh.254122@ncit.edu.np"),
    ("254123", "Prachi Karna", 2, "m2", "prachi.254123@ncit.edu.np"),
    ("254124", "Prajit Kattel", 2, "m2", "prajit.254124@ncit.edu.np"),
    ("254125", "Pramendra Sharma", 2, "m2", "pramendra.254125@ncit.edu.np"),
    ("254126", "Prasanna Bhatta", 2, "m2", "prasanna.254126@ncit.edu.np"),
    ("254127", "Prashun Kunwar", 2, "m2", "prashun.254127@ncit.edu.np"),
    ("254128", "Preeti Kumari Kushwaha", 2, "m2", "preeti.254128@ncit.edu.np"),
    ("254129", "Prerna Yadav", 2, "m2", "prerna.254129@ncit.edu.np"),
    ("254130", "Prishma Adhikari", 2, "m2", "prishma.254130@ncit.edu.np"),
    ("254131", "Ranjita Magar", 2, "m2", "ranjita.254131@ncit.edu.np"),
    ("254132", "Rasnaryan Sah", 2, "m2", "rasnaryan.254132@ncit.edu.np"),
    ("254133", "Ritesh Paudel", 2, "m2", "ritesh.254133@ncit.edu.np"),
    ("254134", "Rojeeka Karki", 2, "m2", "rojeeka.254134@ncit.edu.np"),
    ("254136", "Sabina Gurung", 2, "m2", "sabina.254136@ncit.edu.np"),
    ("254137", "Sanjesh Prasad Sah", 2, "m2", "sanjesh.254137@ncit.edu.np"),
    ("254138", "Santosh Kumar Safi", 2, "m2", "santosh.254138@ncit.edu.np"),
    ("254139", "Shashank Rawat", 2, "m2", "shashank.254139@ncit.edu.np"),
    ("254140", "Sneha Shah", 2, "m2", "sneha.254140@ncit.edu.np"),
    ("254141", "Sugam Tamang", 2, "m2", "sugam.254141@ncit.edu.np"),
    ("254142", "Supreme Malla", 2, "m2", "supreme.254142@ncit.edu.np"),
    ("254143", "Surakshya Yadav", 2, "m2", "surakshya.254143@ncit.edu.np"),
    ("254144", "Tapendra Bohara", 2, "m2", "tapendra.254144@ncit.edu.np"),
    ("254145", "Tusar Karn", 2, "m2", "tusar.254145@ncit.edu.np"),
    ("254146", "Yobson Giri", 2, "m2", "yobson.254146@ncit.edu.np"),
    ("254147", "Yogendra Khadka", 2, "m2", "yogendra.254147@ncit.edu.np"),
    ("254148", "Zenith Sharma", 2, "m2", "zenith.254148@ncit.edu.np"),
    ("254149", "Karan Bohara", 2, "m2", "karan.254149@ncit.edu.np"),
    ("251501", "Aaditya Subedi", 2, "d", "aaditya.251501@ncit.edu.np"),
    ("251502", "Aashish Mandal", 2, "d", "aashish.251502@ncit.edu.np"),
    ("251504", "Amar Jung Sah", 2, "d", "amar.251504@ncit.edu.np"),
    ("251505", "Amrit Subedi", 2, "d", "amrit.251505@ncit.edu.np"),
    ("251506", "Anjali Chaudhary", 2, "d", "anjali.251506@ncit.edu.np"),
    ("251507", "Anju Giri", 2, "d", "anju.251507@ncit.edu.np"),
    ("251508", "Awkram Sheikh", 2, "d", "awkram.251508@ncit.edu.np"),
    ("251509", "Bibek Kumar Yadav", 2, "d", "bibek.251509@ncit.edu.np"),
    ("251510", "Bibhusan Karki", 2, "d", "bibhusan.251510@ncit.edu.np"),
    ("251511", "Bijay Shrestha", 2, "d", "bijay.251511@ncit.edu.np"),
    ("251512", "Bipin Khanal", 2, "d", "bipin.251512@ncit.edu.np"),
    ("251513", "Darpan Rokaha", 2, "d", "darpan.251513@ncit.edu.np"),
    ("251514", "Dipak Kafle", 2, "d", "dipak.251514@ncit.edu.np"),
    ("251515", "Dipesh Kumar Yadav", 2, "d", "dipeshk.251515@ncit.edu.np"),
    ("251516", "Dipesh Pandey", 2, "d", "dipesh.251516@ncit.edu.np"),
    ("251517", "Dipika Prasad Yadav", 2, "d", "dipika.251517@ncit.edu.np"),
    ("251518", "Dipti Timsina", 2, "d", "dipti.251518@ncit.edu.np"),
    ("251519", "Jay Bahadur Shahi", 2, "d", "jay.251519@ncit.edu.np"),
    ("251520", "Karichan Mahato", 2, "d", "karichan.251520@ncit.edu.np"),
    ("251521", "Khagendra Paneru", 2, "d", "khagendra.251521@ncit.edu.np"),
    ("251522", "Minakshi Nath", 2, "d", "minakshi.251522@ncit.edu.np"),
    ("251523", "Mohammad Samsad Shekh", 2, "d", "mohammad.251523@ncit.edu.np"),
    ("251524", "Mohit Chaudhary Tharu", 2, "d", "mohit.251524@ncit.edu.np"),
    ("251525", "Nabin Prasad Upadhyay", 2, "d", "nabin.251525@ncit.edu.np"),
    ("251526", "Pawan Joshi", 2, "d", "pawan.251526@ncit.edu.np"),
    ("251528", "Prerana Lama", 2, "d", "prerana.251528@ncit.edu.np"),
    ("251529", "Princy Bishwakarma", 2, "d", "princy.251529@ncit.edu.np"),
    ("251531", "Reeva Baniya", 2, "d", "reeva.251531@ncit.edu.np"),
    ("251532", "Riya Kumari Chaudhary", 2, "d", "riya.251532@ncit.edu.np"),
    ("251533", "Roshan Kumar Yadav", 2, "d", "roshan.251533@ncit.edu.np"),
    ("251534", "Samir Adhikari", 2, "d", "samir.251534@ncit.edu.np"),
    ("251535", "Sandesh K.C", 2, "d", "sandesh.251535@ncit.edu.np"),
    ("251536", "Sandesh Pangeni", 2, "d", "sandeshp.251536@ncit.edu.np"),
    ("251537", "Sandika Rana Magar", 2, "d", "sandika.251537@ncit.edu.np"),
    ("251538", "Saugat Khatiwada", 2, "d", "saugat.251538@ncit.edu.np"),
    ("251539", "Shaurab Khadka", 2, "d", "shaurab.251539@ncit.edu.np"),
    ("251540", "Shivram Yadav", 2, "d", "shivram.251540@ncit.edu.np"),
    ("251541", "Shreya Rai", 2, "d", "shreya.251541@ncit.edu.np"),
    ("251542", "Sindhu Khadka", 2, "d", "sindhu.251542@ncit.edu.np"),
    ("251543", "Sonu Yadav", 2, "d", "sonu.251543@ncit.edu.np"),
    ("251544", "Suzana Pakhrin", 2, "d", "suzana.251544@ncit.edu.np"),
    ("251545", "Swodikshya Shrestha", 2, "d", "swodikshya.251545@ncit.edu.np"),
    ("251546", "Ujjwal Kumar Mishra", 2, "d", "ujjwal.251546@ncit.edu.np"),
    ("251547", "Upendra Yadav", 2, "d", "uprendra.251547@ncit.edu.np"),
    ("251548", "Aayush Chaudhary", 2, "d", "aayush.251548@ncit.edu.np"),
    ("251549", "Deekshya Chalise", 2, "d", "deekshya.251549@ncit.edu.np"),
    ("251550", "Anshonee K.C", 2, "d", "anshonee.251550@ncit.edu.np"),
    ("241401", "Aashrya Sharma", 4, "m1", "aashrya.241401@ncit.edu.np"),
    ("241403", "Abinav Khadka", 4, "m1", "abinav.241403@ncit.edu.np"),
    ("241404", "Aman Shahi", 4, "m1", "aman.241404@ncit.edu.np"),
    ("241405", "Anjala Ojha", 4, "m1", "anjala.241405@ncit.edu.np"),
    ("241406", "Anjali Rana", 4, "m1", "anjali.241406@ncit.edu.np"),
    ("241407", "Arjun Oli", 4, "m1", "arjun.241407@ncit.edu.np"),
    ("241408", "Asbin Khadka", 4, "m1", "asbin.241408@ncit.edu.np"),
    ("241409", "Avinab Paudel", 4, "m1", "avinab.241409@ncit.edu.np"),
    ("241410", "Bikash Kumar Sah", 4, "m1", "bikash.241410@ncit.edu.np"),
    ("241411", "Dhiraj Thapa", 4, "m1", "dhiraj.241411@ncit.edu.np"),
    ("241413", "Harish Pujara", 4, "m1", "harish.241413@ncit.edu.np"),
    ("241414", "Hiradya Shrestha", 4, "m1", "hiradya.241414@ncit.edu.np"),
    ("241415", "Jipsum Kapri", 4, "m1", "jipsum.241415@ncit.edu.np"),
    ("241416", "Juli Sah", 4, "m1", "juli.241416@ncit.edu.np"),
    ("241417", "Kashish Chaudhary", 4, "m1", "kashish.241417@ncit.edu.np"),
    ("241418", "Mahesh Shrestha", 4, "m1", "mahesh.241418@ncit.edu.np"),
    ("241419", "Manish Humagain", 4, "m1", "manish.241419@ncit.edu.np"),
    ("241420", "MD. Najib Shah Fakir", 4, "m1", "najib.241420@ncit.edu.np"),
    ("241421", "Muskan Shrestha", 4, "m1", "muskan.241421@ncit.edu.np"),
    ("241422", "Naman Yadav", 4, "m1", "naman.241422@ncit.edu.np"),
    ("241423", "Nebil Khanal", 4, "m1", "nebil.241423@ncit.edu.np"),
    ("241425", "Pabitra Kumari Khadka", 4, "m1", "pabitra.241425@ncit.edu.np"),
    ("241426", "Pragun Dhungana", 4, "m1", "pragun.241426@ncit.edu.np"),
    ("241427", "Pranjal Sapkota", 4, "m1", "pranjal.241427@ncit.edu.np"),
    ("241428", "Pranjal Shrestha", 4, "m1", "pranjal.241428@ncit.edu.np"),
    ("241429", "Priyanka Kumari Yadav", 4, "m1", "priyanka.241429@ncit.edu.np"),
    ("241430", "Purnima Regmi", 4, "m1", "purnima.241430@ncit.edu.np"),
    ("241431", "Rajendra Bahadur Rawat", 4, "m1", "rajendra.241431@ncit.edu.np"),
    ("241432", "Rijesh Maharjan", 4, "m1", "rijesh.241432@ncit.edu.np"),
    ("241434", "Sameer Khan", 4, "m1", "sameer.241434@ncit.edu.np"),
    ("241435", "Samip Joshi", 4, "m1", "samip.241435@ncit.edu.np"),
    ("241436", "Sanjay Kumar Sah", 4, "m1", "sanjay.241436@ncit.edu.np"),
    ("241437", "Sara Rai", 4, "m1", "sara.241437@ncit.edu.np"),
    ("241438", "Saroj G.C", 4, "m1", "saroj.241438@ncit.edu.np"),
    ("241439", "Shakshi Singh", 4, "m1", "shakshi.241439@ncit.edu.np"),
    ("241440", "Shalin Sapkota", 4, "m1", "shalin.241440@ncit.edu.np"),
    ("241441", "Shishir Nepal", 4, "m1", "shishir.241441@ncit.edu.np"),
    ("241442", "Shivani Singh", 4, "m1", "shivani.241442@ncit.edu.np"),
    ("241443", "Shreskar Rawal", 4, "m1", "shreskar.241443@ncit.edu.np"),
    ("241444", "Sirjal K.C", 4, "m1", "sirjal.241444@ncit.edu.np"),
    ("241445", "Sudeep Gautam", 4, "m1", "sudeep.241445@ncit.edu.np"),
    ("241446", "Sudhan Adhikari", 4, "m1", "sudhan.241446@ncit.edu.np"),
    ("241447", "Suman Joshi", 4, "m1", "suman.241447@ncit.edu.np"),
    ("241448", "Sworup Maharjan", 4, "m1", "sworup.241448@ncit.edu.np"),
    ("244102", "Aakash Sharma", 4, "m2", "aakash.244102@ncit.edu.np"),
    ("244103", "Aakash Thagunna", 4, "m2", "aakash.244103@ncit.edu.np"),
    ("244105", "Alok Sah", 4, "m2", "alok.244105@ncit.edu.np"),
    ("244106", "Aman Kumar Chaudhary", 4, "m2", "aman.244106@ncit.edu.np"),
    ("244108", "Arjun Bhattarai", 4, "m2", "arjun.244108@ncit.edu.np"),
    ("244110", "Ashish Singh Thalal", 4, "m2", "ashish.244110@ncit.edu.np"),
    ("244111", "Dilasha Chand", 4, "m2", "dilasha.244111@ncit.edu.np"),
    ("244112", "Dipjal Deuja", 4, "m2", "dipjal.244112@ncit.edu.np"),
    ("244113", "Gaurav Prasad Khanal", 4, "m2", "gaurav.244113@ncit.edu.np"),
    ("244115", "Jayashree Oli", 4, "m2", "jayashree.244115@ncit.edu.np"),
    ("244116", "Krishav Koirala", 4, "m2", "krishav.244116@ncit.edu.np"),
    ("244118", "Prashanna Ghimire", 4, "m2", "prashanna.244118@ncit.edu.np"),
    ("244119", "Pratik Dangal", 4, "m2", "pratik.244119@ncit.edu.np"),
    ("244120", "Pratyush Jung Niroula", 4, "m2", "pratyush.244120@ncit.edu.np"),
    ("244121", "Priya Singh", 4, "m2", "priya.244121@ncit.edu.np"),
    ("244122", "Rahul Sah", 4, "m2", "rahul.244122@ncit.edu.np"),
    ("244123", "Reeja Maharjan", 4, "m2", "reeja.244123@ncit.edu.np"),
    ("244125", "Samikshya Sapkota", 4, "m2", "samikshya.244125@ncit.edu.np"),
    ("244126", "Samir Shrestha", 4, "m2", "samir.244126@ncit.edu.np"),
    ("244128", "Sneha Bhatta", 4, "m2", "sneha.244128@ncit.edu.np"),
    ("244129", "Sneha Kumari Gupta", 4, "m2", "sneha.244129@ncit.edu.np"),
    ("244131", "Sugam Pandit", 4, "m2", "sugam.244131@ncit.edu.np"),
    ("244132", "Sujan Regmi", 4, "m2", "sujan.244132@ncit.edu.np"),
    ("244133", "Sujit Godar", 4, "m2", "sujit.244133@ncit.edu.np"),
    ("244137", "Suyog Khadka", 4, "m2", "suyog.244137@ncit.edu.np"),
    ("244139", "Brijesh Kumar Chaudhary", 4, "m2", "brijesh.244139@ncit.edu.np"),
    ("244140", "Bishwas Bhandari", 4, "m2", "bishwas.244140@ncit.edu.np"),
    ("244141", "Nisemang Subba", 4, "m2", "nisemang.244141@ncit.edu.np"),
    ("244142", "Laxmi Adhikari", 4, "m2", "laxmi.244142@ncit.edu.np"),
    ("244143", "Sadiksha Kafle", 4, "m2", "sadiksha.244143@ncit.edu.np"),
    ("244144", "Surendra Kumar Mahato", 4, "m2", "surendra.244144@ncit.edu.np"),
    ("244146", "Pratik Budathoki", 4, "m2", "pratik.244146@ncit.edu.np"),
    ("244148", "Mahima Khadka", 4, "m2", "mahima.244148@ncit.edu.np"),
    ("244149", "Nisha Adhikari", 4, "m2", "nisha.244149@ncit.edu.np"),
    ("244150", "Aakash Gaire", 4, "m2", "aakash.244150@ncit.edu.np"),
    ("244151", "Babisha Adhikari", 4, "m2", "babisha.244151@ncit.edu.np"),
    ("244152", "Dev Bahadur Thakuri", 4, "m2", "dev.244152@ncit.edu.np"),
    ("244153", "Tamanna Karki", 4, "m2", "tamanna.244153@ncit.edu.np"),
    ("241509", "Jiwan Chapagain", 4, "d", "jiwan.241509@ncit.edu.np"),
    ("244155", "Satya Narayan Yadav", 4, "m2", "satya.244155@ncit.edu.np"),
    ("244156", "Abismaran budha Magar", 4, "m2", "abismaran.244156@ncit.edu.np"),
    ("241501", "Aaditya Shah", 4, "d", "aaditya.241501@ncit.edu.np"),
    ("241503", "Alex Shah", 4, "d", "alex.241503@ncit.edu.np"),
    ("241505", "Bhuwan K.C", 4, "d", "bhuwan.241505@ncit.edu.np"),
    ("241506", "Bibas Bishwokarma", 4, "d", "bibas.241506@ncit.edu.np"),
    ("241507", "Bishal K.C", 4, "d", "bishal.241507@ncit.edu.np"),
    ("241508", "Diwakar Ghimire", 4, "d", "diwakar.241508@ncit.edu.np"),
    ("241510", "Kritagya Pangeni", 4, "d", "kritagya.241510@ncit.edu.np"),
    ("241511", "Mansi Jayswal", 4, "d", "mansi.241511@ncit.edu.np"),
    ("241512", "Mira Khadka", 4, "d", "mira.241512@ncit.edu.np"),
    ("241513", "Mohit Bohara", 4, "d", "mohit.241513@ncit.edu.np"),
    ("241514", "Mukesh Kumar Mahato", 4, "d", "mukesh.241514@ncit.edu.np"),
    ("241515", "Nikita Manandhar", 4, "d", "nikita.241515@ncit.edu.np"),
    ("241516", "Nirmala Subedi", 4, "d", "nirmala.241516@ncit.edu.np"),
    ("241517", "Pradeep Poudel", 4, "d", "pradeep.241517@ncit.edu.np"),
    ("241518", "Rachana Bhattarai", 4, "d", "rachana.241518@ncit.edu.np"),
    ("241519", "Roshan Kumar Sah", 4, "d", "roshan.241519@ncit.edu.np"),
    ("241520", "Shiba Bhatta", 4, "d", "shiba.241520@ncit.edu.np"),
    ("241521", "Shristi Thapa", 4, "d", "shristi.241521@ncit.edu.np"),
    ("241522", "Shubhakant Chaudhary", 4, "d", "shubhakant.241522@ncit.edu.np"),
    ("241523", "Subash Oli", 4, "d", "subash.241523@ncit.edu.np"),
    ("241524", "Sudip Paudel", 4, "d", "sudip.241524@ncit.edu.np"),
    ("241525", "Suprabhat Chaudhary", 4, "d", "suprabhat.241525@ncit.edu.np"),
    ("241526", "Sushil Gaire", 4, "d", "sushil.241526@ncit.edu.np"),
    ("241527", "Ujjwal Jaiswal", 4, "d", "ujjwal.241527@ncit.edu.np"),
    ("241528", "Sushil Nepal", 4, "d", "sushil.241528@ncit.edu.np"),
    ("241529", "Pratik Kumar Thakur", 4, "d", "pratik.241529@ncit.edu.np"),
    ("241531", "Utsab Adhikari", 4, "d", "utsab.241531@ncit.edu.np"),
    ("241532", "Nishma Swikriti Neupane", 4, "d", "nishma.241532@ncit.edu.np"),
    ("241533", "Uttam Sah", 4, "d", "uttam.241533@ncit.edu.np"),
    ("241534", "Prabin Kumar Yadav", 4, "d", "prabin.241534@ncit.edu.np"),
    ("241535", "Sandip Updhyaya", 4, "d", "sandip.241535@ncit.edu.np"),
    ("241536", "Emmanuel G.C", 4, "d", "emmanuel.241536@ncit.edu.np"),
    ("241537", "Manish Raj Yadav", 4, "d", "manish.241537@ncit.edu.np"),
    ("241539", "Srijana Kumari Uranw", 4, "d", "srijana.241539@ncit.edu.np"),
    ("241540", "Shahrish Mikrani", 4, "d", "shahrish.241540@ncit.edu.np"),
    ("241541", "Samir Shekha", 4, "d", "samir.241541@ncit.edu.np"),
    ("241542", "Anup Rai", 4, "d", "anup.241542@ncit.edu.np"),
    ("241543", "Lok Bikram Bist", 4, "d", "lok.241543@ncit.edu.np"),
    ("231401", "Aadarsha Adhikari", 6, "m1", "aadarsha.231401@ncit.edu.np"),
    ("231402", "Aaryan Ghimire", 6, "m1", "aaryan.231402@ncit.edu.np"),
    ("231403", "Aayush Dhungana", 6, "m1", "aayush.231403@ncit.edu.np"),
    ("231404", "Abhi Khatiwada", 6, "m1", "abhi.231404@ncit.edu.np"),
    ("231405", "Abinistha Maharjan", 6, "m1", "abinistha.231405@ncit.edu.np"),
    ("231407", "Aditi Satyal", 6, "m1", "aditi.231407@ncit.edu.np"),
    ("231408", "Aparna Baral", 6, "m1", "aparna.231408@ncit.edu.np"),
    ("231410", "Asha Giri", 6, "m1", "asha.231410@ncit.edu.np"),
    ("231411", "Avishek Mehta", 6, "m1", "avishek.231411@ncit.edu.np"),
    ("231412", "Bibek Kumar Yadav", 6, "m1", "bibek.231412@ncit.edu.np"),
    ("231413", "Binit Deupala", 6, "m1", "binit.231413@ncit.edu.np"),
    ("231414", "Banita Rayamajhi", 6, "m1", "binita.231414@ncit.edu.np"),
    ("231415", "Binod Baduwal", 6, "m1", "binod.231415@ncit.edu.np"),
    ("231417", "Dikshya Thakulla", 6, "m1", "dikshya.231417@ncit.edu.np"),
    ("231418", "Dipesh Thapa", 6, "m1", "dipesh.231418@ncit.edu.np"),
    ("231419", "Drishti Maharjan", 6, "m1", "drishti.231419@ncit.edu.np"),
    ("231420", "Gaurav Pandey", 6, "m1", "gaurav.231420@ncit.edu.np"),
    ("231421", "Ismaran Neupane", 6, "m1", "ismaran.231421@ncit.edu.np"),
    ("231422", "Jatin Chaudhary", 6, "m1", "jatin.231422@ncit.edu.np"),
    ("231423", "Jentil Umaar", 6, "m1", "jentil.231423@ncit.edu.np"),
    ("231424", "Jitendra Narayan Raut", 6, "m1", "jitendra.231424@ncit.edu.np"),
    ("231425", "Komal Basnet", 6, "m1", "komal.231425@ncit.edu.np"),
    ("231426", "Lumanti Dangol", 6, "m1", "lumanti.231426@ncit.edu.np"),
    ("231427", "Nabin Kumar Yadav", 6, "m1", "nabin.231427@ncit.edu.np"),
    ("231428", "Namrata Tamang", 6, "m1", "namarta.231428@ncit.edu.np"),
    ("231429", "Pradeep G.C", 6, "m1", "pradeep.231429@ncit.edu.np"),
    ("231430", "Prajal Gautam", 6, "m1", "prajal.231430@ncit.edu.np"),
    ("231431", "Prarabdha Wagle", 6, "m1", "prarabdha.231431@ncit.edu.np"),
    ("231433", "Pujan Bhakta Shrestha", 6, "m1", "pujan.231433@ncit.edu.np"),
    ("231434", "Raghav Bista", 6, "m1", "rajhav.231434@ncit.edu.np"),
    ("231435", "Rivana Maharjan", 6, "m1", "rivana.231435@ncit.edu.np"),
    ("231436", "Ronil Maharjan", 6, "m1", "ronil.231436@ncit.edu.np"),
    ("231437", "Sakshyam Bhatta", 6, "m1", "sakshyam.231437@ncit.edu.np"),
    ("231438", "Salina Kandel", 6, "m1", "salina.231438@ncit.edu.np"),
    ("231439", "Saroj Saundarary Mahara", 6, "m1", "saroj.231439@ncit.edu.np"),
    ("231442", "Suhana Thapa", 6, "m1", "suhana.231442@ncit.edu.np"),
    ("231443", "Sujal Ghimire", 6, "m1", "sujal.231443@ncit.edu.np"),
    ("231444", "Sujal Shrestha", 6, "m1", "sujal.231444@ncit.edu.np"),
    ("231445", "Sumit Adhikari", 6, "m1", "sumit.231445@ncit.edu.np"),
    ("231448", "Yugesh Man Shrestha", 6, "m1", "yugesh.231448@ncit.edu.np"),
    ("231450", "Gagan Prasain", 6, "m1", "gagan.231450@ncit.edu.np"),
    ("234101", "Abdul Wahab Rain", 6, "m2", "abdul.234101@ncit.edu.np"),
    ("234102", "Ananda Rai", 6, "m2", "ananda.234102@ncit.edu.np"),
    ("234103", "Anushka Joshi", 6, "m2", "anushka.234103@ncit.edu.np"),
    ("234104", "Christina Maskey", 6, "m2", "christina.234104@ncit.edu.np"),
    ("234105", "Kanchan Kumari Mainali", 6, "m2", "kanchan.234105@ncit.edu.np"),
    ("234106", "Lasta Shrestha", 6, "m2", "lasta.234106@ncit.edu.np"),
    ("234107", "Mohammad Faishal Rain", 6, "m2", "mohammad.234107@ncit.edu.np"),
    ("234108", "Prajwal Singh", 6, "m2", "prajwal.234108@ncit.edu.np"),
    ("234110", "Priyanka Shah", 6, "m2", "priyanka.234110@ncit.edu.np"),
    ("234111", "Pushparanjan Bishwakarma", 6, "m2", "pushparanjan.234111@ncit.edu.np"),
    ("234112", "Rajan Bhandari", 6, "m2", "rajan.234112@ncit.edu.np"),
    ("234113", "Ravi Ranjan Sah", 6, "m2", "ravi.234113@ncit.edu.np"),
    ("234115", "Saron Awale", 6, "m2", "saron.234115@ncit.edu.np"),
    ("234118", "Shreya Bhantana", 6, "m2", "shreya.234118@ncit.edu.np"),
    ("234119", "Supriya Koirala", 6, "m2", "supriya.234119@ncit.edu.np"),
    ("234122", "Aashik Thakur", 6, "m2", "aashik.234122@ncit.edu.np"),
    ("234123", "Lokesh Dhakal", 6, "m2", "lokesh.234123@ncit.edu.np"),
    ("234125", "Ajay Kumar Sah", 6, "m2", "ajay.234125@ncit.edu.np"),
    ("231521", "Pappu Kumar Yadav", 6, "d", "pappu.231521@ncit.edu.np"),
    ("231449", "Dipansu Rauniyar", 6, "m1", "dipansu.231449@ncit.edu.np"),
    ("231539", "Prasanna Khanal", 6, "d", "prasanna.231539@ncit.edu.np"),
    ("231511", "Bishwas Ghimire", 6, "d", "bishwash.231511@ncit.edu.np"),
    ("231501", "Aayushman Shrestha", 6, "d", "aayushman.231501@ncit.edu.np"),
    ("231502", "Anamika Aryal", 6, "d", "anamika.231502@ncit.edu.np"),
    ("231503", "Anjana Chaudhary", 6, "d", "anjana.231503@ncit.edu.np"),
    ("231505", "Anshika Pant", 6, "d", "anshika.231505@ncit.edu.np"),
    ("231506", "Arjun Mandal", 6, "d", "arjun.231506@ncit.edu.np"),
    ("231507", "Arya Uprety", 6, "d", "arya.231507@ncit.edu.np"),
    ("231508", "Ashwin Acharya", 6, "d", "ashwin.231508@ncit.edu.np"),
    ("231510", "Bibek Kumar Jha", 6, "d", "bibek.231510@ncit.edu.np"),
    ("231512", "Dip Kiran Limbu", 6, "d", "dip.231512@ncit.edu.np"),
    ("231513", "Dipeen Kaucha Magar", 6, "d", "dipeen.231513@ncit.edu.np"),
    ("231514", "Dipesh Kumar Goit", 6, "d", "dipesh.231514@ncit.edu.np"),
    ("231515", "Kanchan Gupta", 6, "d", "kanchan.231515@ncit.edu.np"),
    ("231516", "Kritika Shrestha", 6, "d", "kritika.231516@ncit.edu.np"),
    ("231517", "Manshi Purbey", 6, "d", "manshi.231517@ncit.edu.np"),
    ("231518", "Nabin Kumar Sah", 6, "d", "nabin.231518@ncit.edu.np"),
    ("231519", "Navanit Sharma", 6, "d", "navanit.231519@ncit.edu.np"),
    ("231520", "Nobel Khadka", 6, "d", "nobel.231520@ncit.edu.np"),
    ("231522", "Prabin Bhusal", 6, "d", "prabin.231522@ncit.edu.np"),
    ("231523", "Prakrite Dahal", 6, "d", "prakrite.231523@ncit.edu.np"),
    ("231525", "Puja Ghatri Magar", 6, "d", "puja.231525@ncit.edu.np"),
    ("231526", "Ranjita Thapa Chhetri", 6, "d", "ranjeeta.231526@ncit.edu.np"),
    ("231527", "Reevaj Baidya", 6, "d", "reevaj.231527@ncit.edu.np"),
    ("231528", "Roshan Chaudhary", 6, "d", "roshan.231528@ncit.edu.np"),
    ("231529", "Roshani Sah", 6, "d", "roshani.231529@ncit.edu.np"),
    ("231530", "Sagar Koirala", 6, "d", "sagar.231530@ncit.edu.np"),
    ("231531", "Samir Katuwal", 6, "d", "samir.231531@ncit.edu.np"),
    ("231532", "Saugat Pudasaini", 6, "d", "saugat.231532@ncit.edu.np"),
    ("231533", "Saurav Khanal", 6, "d", "saurav.231533@ncit.edu.np"),
    ("231534", "Sittal Pantha", 6, "d", "sittal.231534@ncit.edu.np"),
    ("231535", "Suhana Bhandari", 6, "d", "suhana.231535@ncit.edu.np"),
    ("231536", "Sumit Kumar Das", 6, "d", "sumit.231536@ncit.edu.np"),
    ("231537", "Suraj Kumar Jha", 6, "d", "suraj.231537@ncit.edu.np"),
    ("231538", "Yashaskar Gautam", 6, "d", "yashaskar.231538@ncit.edu.np"),
    ("231541", "Bishal Kumar Yadav", 6, "d", "bishal.231541@ncit.edu.np"),
    ("231542", "Jibachh Yadav", 6, "d", "jibachh.231542@ncit.edu.np"),
    ("234120", "Sushant Regmi", 6, "m2", "sushant.234120@ncit.edu.np"),
]

# CRNs of the 14 students who currently have real enrollment photos on disk,
# at data/enrollment_photos/<crn>/. Rename the existing first-name folders to
# these CRNs — see the message alongside this seed for the exact mv commands.
PHOTO_ENROLLED_CRNS = {
    "234122",  # Aashik Thakur
    "231502",  # Anamika Aryal
    "234102",  # Ananda Rai
    "231503",  # Anjana Chaudhary
    "234103",  # Anushka Joshi
    "234104",  # Christina Maskey
    "231516",  # Kritika Shrestha
    "234106",  # Lasta Shrestha
    "234123",  # Lokesh Dhakal
    "231529",  # Roshani Sah
    "231512",  # Dip Kiran Limbu
    "234120",  # Sushant Regmi
    "231535",  # Suhana Bhandari
    "234111",  # Pushparanjan Bishwakarma
}

# Single admin login — replaces every admin/hod/teacher/student @ssms.edu
# demo account. There's no real "admin" person in the source roster (the
# college roster only lists faculty who teach), so this is one generic
# institutional login rather than an invented name. must_change_password=True
# so it isn't left on the seeded default in a real deployment.
ADMIN_EMAIL = "admin@ncit.edu.np"
DEFAULT_ADMIN_PASSWORD = "admin123"
ADMIN_PROFILE = dict(
    name="Er. Niranjan Khakurel",
    title="Principal",
    email=ADMIN_EMAIL,
    phone="+977 9851198517",
    institution="Nepal College of Information Technology (NCIT)",
    qualification="ME in Computer Engineering, NCIT, Pokhara University; PhD Scholar, Tribhuvan University",
    experience="18+ years in academia, teaching, research, and projects",
)

DEFAULT_TEACHER_PASSWORD = "teacher123"
DEFAULT_HOD_PASSWORD = "hod123"

# Every @ssms.edu demo login this seed used to create or preserve. All of
# these — and any Teacher/HOD profile hanging off them — are retired in the
# cleanup pass below.
LEGACY_DEMO_EMAILS = ("admin@ssms.edu", "hod@ssms.edu", "teacher@ssms.edu", "student@ssms.edu")

# (name, title, specialization, qualification, experience) — specialization
# follows from what each person actually teaches below; title/qualification/
# experience are invented (Er. is the standard title for BE-affiliated
# engineering faculty in Nepal, Dr. for the two with the most course load).
TEACHERS = [
    ("Himalaya Ghimire", "Er.", "Engineering Mathematics", "M.Sc. in Mathematics, Tribhuvan University", "9 years"),
    ("Deepak Raj Aryal", "Er.", "Applied Mathematics", "M.Sc. in Mathematics, Tribhuvan University", "11 years"),
    ("Purna Pd Sharma", "Er.", "Engineering Mathematics", "M.Sc. in Mathematics, Tribhuvan University", "14 years"),
    ("Bibek Pudashaini", "Er.", "Engineering Drawing & Design", "M.Sc. in Mechanical Engineering, Pokhara University", "7 years"),
    ("Tirtha Raj Bhatta", "Er.", "Technical Communication", "M.A. in English, Tribhuvan University", "10 years"),
    ("Shivahari Acharya", "Er.", "Digital Logic & Electronics", "M.Sc. in Electronics & Communication, Pokhara University", "8 years"),
    ("Yogesh Deo", "Er.", "Computer Networks & Digital Systems", "M.Sc. in Computer Engineering, Pokhara University", "6 years"),
    ("Ankit Kharel", "Er.", "Discrete Mathematics & Programming", "M.Sc. in Computer Science, Tribhuvan University", "5 years"),
    ("Nirdsoh Adhikari", "Er.", "Object-Oriented Programming", "M.Sc. in Computer Engineering, Pokhara University", "6 years"),
    ("Shree Krishna Yadav", "Er.", "Software Engineering", "M.Sc. in Software Engineering, Pokhara University", "9 years"),
    ("Amit K Shrivastava", "Er.", "Operating Systems", "M.Sc. in Computer Engineering, Pokhara University", "8 years"),
    ("Manil Vaidhya", "Er.", "Database Systems & Algorithms", "M.Sc. in Computer Engineering, Pokhara University", "7 years"),
    ("Mahesh Neupane", "Dr.", "Computer Architecture & Networks", "Ph.D. in Computer Engineering, Pokhara University", "16 years"),
    ("Kumar Pudashine", "Er.", "IT Infrastructure & Systems Administration", "M.Sc. in Information Technology, Pokhara University", "10 years"),
    ("Simanta Kasaju", "Er.", "Web Technologies", "M.Sc. in Computer Engineering, Pokhara University", "5 years"),
    ("Himal Acharya", "Er.", "Data Communication", "M.Sc. in Electronics & Communication, Pokhara University", "9 years"),
    ("Ashim Khadka", "Dr.", "Data Science & Analytics", "Ph.D. in Data Science, Pokhara University", "8 years"),
    ("Deependra Banskota", "Er.", "Engineering Management", "MBA, Pokhara University", "12 years"),
    ("Rishi Kant Marseni", "Er.", "Internet of Things", "M.Sc. in Computer Engineering, Pokhara University", "6 years"),
]

# name with any single-letter middle initial dropped -> firstname.lastname@ncit.edu.np
def _teacher_email(name: str) -> str:
    parts = [p for p in name.replace(".", "").split(" ") if len(p) > 1]
    return f"{parts[0].lower()}.{parts[-1].lower()}@ncit.edu.np"

# (code, name, sem, credits, teacher) — teacher is either one name (that
# person covers all three sections) or a {section_id: name} dict when the
# roster listed multiple names, or None for the two sem-VI rows the real
# sheet itself leaves blank (Project I, Elective I — supervisor/choice
# driven, not lecture-assigned). Codes follow the PREFIX NNN convention
# visible elsewhere in the college's own course list (ENG 111, CMP 109,
# MTH 112, ...): shared first-year subjects reuse the real shared code
# (ENG 111 - Communication Techniques is the same course under any
# programme), IT-major subjects get an unused CMP/CT/ELX/MTH number.
# CMP 360 for Data Science and Analytics is the one already-known real code.
COURSE_TEMPLATES = [
    # --- Semester II ---
    ("MTH 116", "Algebra and Geometry", 2, 3, {"m1": "Himalaya Ghimire", "m2": "Deepak Raj Aryal", "d": "Purna Pd Sharma"}),
    ("MEC 115", "Basic Engineering Drawing", 2, 1, "Bibek Pudashaini"),
    ("ENG 111", "Communication Techniques", 2, 2, "Tirtha Raj Bhatta"),
    ("ELX 112", "Digital Logic", 2, 3, {"m1": "Shivahari Acharya", "d": "Shivahari Acharya", "m2": "Yogesh Deo"}),
    ("CMP 116", "Discrete Structure", 2, 3, "Ankit Kharel"),
    ("CMP 117", "Object Oriented Programming in C++", 2, 3, "Nirdsoh Adhikari"),
    ("CMP 118", "Computer Workshop", 2, 1, "Shree Krishna Yadav"),
    # --- Semester IV ---
    ("MTH 214", "Applied Mathematics", 4, 3, "Deepak Raj Aryal"),
    ("CMP 214", "Applied Operating Systems", 4, 3, "Amit K Shrivastava"),
    ("CMP 215", "Database Management System", 4, 3, "Manil Vaidhya"),
    ("ELX 213", "Microprocessor and Computer Architecture", 4, 3, "Mahesh Neupane"),
    ("CT 214", "System Administration and IT Infrastructure Services", 4, 3, "Kumar Pudashine"),
    ("CT 215", "Web Technology", 4, 3, "Simanta Kasaju"),
    # --- Semester VI ---
    ("CT 311", "Computer Networks", 6, 3, {"d": "Mahesh Neupane", "m1": "Mahesh Neupane", "m2": "Yogesh Deo"}),
    ("CMP 312", "Data Communication", 6, 3, "Himal Acharya"),
    ("CMP 360", "Data Science and Analytics", 6, 3, "Ashim Khadka"),
    ("MGT 313", "Engineering Management", 6, 2, "Deependra Banskota"),
    ("CT 314", "Internet of Things", 6, 3, "Rishi Kant Marseni"),
    ("CT 315", "Project I", 6, 2, None),
    ("CT 316", "Elective I", 6, 3, None),
]

# Real HOD: Mahesh Neupane, who also teaches (see TEACHERS/COURSE_TEMPLATES
# above — "Microprocessor and Computer Architecture" and half of "Computer
# Networks"). Qualification/experience reuse his TEACHERS entry since it's
# the same person; phone/office are invented HOD-office-specific values,
# following the same convention as the rest of the invented contact fields
# in this file.
#
# One User account = one role (see RoleEnum + require_role), so he needs a
# second login distinct from his teacher one (mahesh.neupane@ncit.edu.np) to
# reach the HOD dashboard — HOD_EMAIL below, a role-based mailbox rather than
# a second personal address, matching how the college itself would issue it.
HOD_EMAIL = "hod.it@ncit.edu.np"
HOD_PROFILE = dict(
    name="Dr. Mahesh Neupane",
    qualification="Ph.D. in Computer Engineering, Pokhara University",
    experience="16 years",
    phone="+977 98-5100-2200",
    office="IT Block — Room 501 (HOD Chamber)",
)


def seed():
    db = SessionLocal()
    try:
        # --- wipe the old CE placeholder data (dept, section, course, the
        # 14 first-name dummy students, their enrollments, teachers, HOD,
        # and every login attached to any of it — nothing from the old demo
        # design is preserved anymore) ---
        old_student_ids = [s.id for s in db.query(Student).filter(Student.department_id == "ce").all()]
        if old_student_ids:
            # AttendanceRecord and InternalMark both FK to students.id with no
            # cascade — if you've run any test attendance or marks against the
            # old dummy roster, those rows have to go first or the Student
            # delete below hits a FK violation.
            db.query(AttendanceRecord).filter(AttendanceRecord.student_id.in_(old_student_ids)).delete(synchronize_session=False)
            db.query(InternalMark).filter(InternalMark.student_id.in_(old_student_ids)).delete(synchronize_session=False)
            db.query(Enrollment).filter(Enrollment.student_id.in_(old_student_ids)).delete(synchronize_session=False)
            old_user_ids = [s.user_id for s in db.query(Student).filter(Student.id.in_(old_student_ids)).all() if s.user_id]
            db.query(Student).filter(Student.id.in_(old_student_ids)).delete(synchronize_session=False)
            if old_user_ids:
                db.query(User).filter(User.id.in_(old_user_ids)).delete(synchronize_session=False)
        db.query(Course).filter(Course.department_id == "ce").delete(synchronize_session=False)

        old_teacher_ids = [t.id for t in db.query(Teacher).filter(Teacher.department_id == "ce").all()]
        old_hod_ids = [h.id for h in db.query(HOD).filter(HOD.department_id == "ce").all()]
        if old_teacher_ids or old_hod_ids:
            old_staff_user_ids = [
                t.user_id for t in db.query(Teacher).filter(Teacher.id.in_(old_teacher_ids)).all() if t.user_id
            ] + [
                h.user_id for h in db.query(HOD).filter(HOD.id.in_(old_hod_ids)).all() if h.user_id
            ]
            db.query(Teacher).filter(Teacher.id.in_(old_teacher_ids)).delete(synchronize_session=False)
            db.query(HOD).filter(HOD.id.in_(old_hod_ids)).delete(synchronize_session=False)
            if old_staff_user_ids:
                db.query(User).filter(User.id.in_(old_staff_user_ids)).delete(synchronize_session=False)

        db.query(Department).filter(Department.id == "ce").delete(synchronize_session=False)
        db.commit()

        # --- migrate away from every @ssms.edu demo login (admin/hod/
        # teacher/student) from any earlier seed run, including whatever
        # Teacher/HOD profile is still attached to them ---
        legacy_users = db.query(User).filter(User.email.in_(LEGACY_DEMO_EMAILS)).all()
        if legacy_users:
            legacy_user_ids = [u.id for u in legacy_users]
            db.query(Teacher).filter(Teacher.user_id.in_(legacy_user_ids)).delete(synchronize_session=False)
            db.query(HOD).filter(HOD.user_id.in_(legacy_user_ids)).delete(synchronize_session=False)
            db.query(Student).filter(Student.user_id.in_(legacy_user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(legacy_user_ids)).delete(synchronize_session=False)
            db.commit()

        # legacy fictional HOD from an even earlier iteration of this seed
        legacy_hod = db.query(HOD).filter(
            HOD.department_id == DEPARTMENT_ID, HOD.name == "Dr. Sudarshan Karki"
        ).first()
        if legacy_hod:
            legacy_hod_user_id = legacy_hod.user_id
            db.delete(legacy_hod)
            db.commit()
            if legacy_hod_user_id:
                db.query(User).filter(User.id == legacy_hod_user_id).delete(synchronize_session=False)
                db.commit()

        # --- department + sections ---
        if not db.query(Department).filter(Department.id == DEPARTMENT_ID).first():
            db.add(Department(id=DEPARTMENT_ID, name=DEPARTMENT_NAME, code=DEPARTMENT_CODE))

        for sec_id, label in SECTIONS:
            if not db.query(Section).filter(Section.id == sec_id).first():
                db.add(Section(id=sec_id, label=label))
        db.commit()

        # --- students + their login accounts ---
        created_students = 0
        for crn, name, sem, section_id, email in IT_STUDENTS:
            if db.query(Student).filter(Student.id == crn).first():
                continue  # already seeded, idempotent re-run

            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=hash_password(DEFAULT_STUDENT_PASSWORD),
                    role=RoleEnum.student,
                    must_change_password=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            db.add(Student(
                id=crn,
                user_id=user.id,
                name=name,
                enrollment=crn,
                photo=None,  # set for the 14 PHOTO_ENROLLED_CRNS once their folders are renamed
                department_id=DEPARTMENT_ID,
                sem=sem,
                section_id=section_id,
                email=email,
            ))
            created_students += 1
        db.commit()

        # --- teachers + their login accounts — every teacher, including
        # Manil Vaidhya, gets their own firstname.lastname@ncit.edu.np /
        # teacher123 login, same pattern, no special cases ---
        teacher_id_by_name = {}
        for i, (name, title, specialization, qualification, experience) in enumerate(TEACHERS):
            existing = db.query(Teacher).filter(
                Teacher.name == name, Teacher.department_id == DEPARTMENT_ID
            ).first()
            if existing:
                teacher_id_by_name[name] = existing.id
                continue

            email = _teacher_email(name)
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email, hashed_password=hash_password(DEFAULT_TEACHER_PASSWORD),
                    role=RoleEnum.teacher, must_change_password=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            teacher = Teacher(
                user_id=user.id, name=name, title=title, department_id=DEPARTMENT_ID,
                specialization=specialization, qualification=qualification,
                email=user.email, phone=f"+977 98-{4100 + i}-{6200 + i}",
                office=f"IT Block — Room {201 + i}",
                office_hours=f"Sun–Thu · {1 + (i % 4)}:00 – {3 + (i % 4)}:00 PM",
                experience=experience,
                photo=f"https://i.pravatar.cc/160?img={(i * 4 + 11) % 70}",
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
            teacher_id_by_name[name] = teacher.id

        # --- courses — one row per section per template, matching the
        # frontend's "dept-sem-section-code" composite id scheme, enrolling
        # every currently-seeded student whose sem/section matches ---
        created_courses = 0
        enrollment_count = 0
        for code, name, sem, credits, teacher_spec in COURSE_TEMPLATES:
            code_slug = code.lower().replace(" ", "").replace("-", "")
            for section_id, _ in SECTIONS:
                course_id = f"{DEPARTMENT_ID}-{sem}-{section_id}-{code_slug}"

                if isinstance(teacher_spec, dict):
                    teacher_name = teacher_spec.get(section_id)
                else:
                    teacher_name = teacher_spec  # a name (all sections) or None (unassigned)
                teacher_id = teacher_id_by_name.get(teacher_name) if teacher_name else None

                course = db.query(Course).filter(Course.id == course_id).first()
                if not course:
                    course = Course(
                        id=course_id, code=code, name=name, credits=credits,
                        sem=sem, department_id=DEPARTMENT_ID, section_id=section_id,
                        teacher_id=teacher_id,
                    )
                    db.add(course)
                    db.commit()
                    created_courses += 1
                elif course.teacher_id != teacher_id:
                    course.teacher_id = teacher_id
                    db.commit()

                roster = db.query(Student).filter(
                    Student.department_id == DEPARTMENT_ID,
                    Student.sem == sem,
                    Student.section_id == section_id,
                ).all()
                for s in roster:
                    exists = db.query(Enrollment).filter(
                        Enrollment.student_id == s.id, Enrollment.course_id == course_id
                    ).first()
                    if not exists:
                        db.add(Enrollment(student_id=s.id, course_id=course_id))
                        enrollment_count += 1
        db.commit()

        # --- HOD profile — Mahesh Neupane's second login, at HOD_EMAIL ---
        hod_user = db.query(User).filter(User.email == HOD_EMAIL).first()
        if not hod_user:
            hod_user = User(
                email=HOD_EMAIL, hashed_password=hash_password(DEFAULT_HOD_PASSWORD),
                role=RoleEnum.hod, must_change_password=True,
            )
            db.add(hod_user)
            db.commit()
            db.refresh(hod_user)
        if not db.query(HOD).filter(HOD.user_id == hod_user.id).first():
            db.add(HOD(
                user_id=hod_user.id, name=HOD_PROFILE["name"], email=hod_user.email,
                phone=HOD_PROFILE["phone"], qualification=HOD_PROFILE["qualification"],
                experience=HOD_PROFILE["experience"], department_id=DEPARTMENT_ID,
            ))
            db.commit()

        # --- admin account + profile ---
        admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if not admin_user:
            admin_user = User(
                email=ADMIN_EMAIL,
                hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
                role=RoleEnum.admin,
                must_change_password=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        # Update the existing admin profile on every seed run.
        # This deliberately does NOT create duplicate profiles.
        admin_profile = db.query(Admin).filter(
            Admin.user_id == admin_user.id
        ).first()

        if not admin_profile:
            admin_profile = Admin(
                user_id=admin_user.id,
                name=ADMIN_PROFILE["name"],
                title=ADMIN_PROFILE["title"],
                email=ADMIN_PROFILE["email"],
                phone=ADMIN_PROFILE["phone"],
                institution=ADMIN_PROFILE["institution"],
                qualification=ADMIN_PROFILE["qualification"],
                experience=ADMIN_PROFILE["experience"],
            )
            db.add(admin_profile)
        else:
            admin_profile.name = ADMIN_PROFILE["name"]
            admin_profile.title = ADMIN_PROFILE["title"]
            admin_profile.email = ADMIN_PROFILE["email"]
            admin_profile.phone = ADMIN_PROFILE["phone"]
            admin_profile.institution = ADMIN_PROFILE["institution"]
            admin_profile.qualification = ADMIN_PROFILE["qualification"]
            admin_profile.experience = ADMIN_PROFILE["experience"]

        db.commit()

        print(f"Seeded {created_students} IT students, {len(TEACHERS)} teachers, "
              f"{created_courses} courses, {enrollment_count} enrollments, "
              f"1 HOD profile, 1 admin profile.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()