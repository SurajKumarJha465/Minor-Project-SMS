from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Course, Student, Enrollment
from api.schemas import CourseOut, StudentOut

router = APIRouter(prefix="/api/courses", tags=["roster"])


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()

    return CourseOut(
        id=course.id,
        code=course.code,
        name=course.name,
        credits=course.credits,
        sem=course.sem,
        dept=course.department_id,
        enrolled=enrolled_count,
    )


@router.get("/{course_id}/roster", response_model=list[StudentOut])
def get_roster(course_id: str, db: Session = Depends(get_db)):
    student_ids = [
        e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    ]
    if not student_ids:
        return []

    students = db.query(Student).filter(Student.id.in_(student_ids)).all()

    return [
        StudentOut(
            id=s.id,
            name=s.name,
            enrollment=s.enrollment,
            photo=s.photo,
        )
        for s in students
    ]