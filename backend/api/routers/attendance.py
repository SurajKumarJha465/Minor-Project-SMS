import sys
import os
import tempfile
import cv2
import numpy as np
from datetime import date
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))
from detection import get_face_crops
from recognition import get_embedding, load_known_embeddings

from ultralytics import YOLO
from api.database import get_db
from api.models import Student, Enrollment, AttendanceRecord, AttendanceStatus, RoleEnum, Course, Teacher
from api.auth import require_role, get_current_user
from api.models import User
from api.activity import log_teacher_activity
from api.schemas import AttendanceTodayResponse, AttendanceTodayItem

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "yolov11s-face.pt")
_model = YOLO(MODEL_PATH)

THRESHOLD = 0.4


@router.post("/recognize")
def recognize_frame(
    course_id: str = Form(...),
    frame: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher, RoleEnum.admin)),
):
    """
    Accepts one captured webcam frame + the course being taken.
    Runs YOLO detection + ArcFace matching, restricted to students
    actually enrolled in this course's roster (not the whole database).
    Returns which enrolled students were recognized in this frame.

    Deliberately a sync `def`, not `async def`: everything below (image
    decode, YOLO inference, InsightFace inference) is synchronous CPU-bound
    work with no internal awaits. As an `async def` it would run straight on
    the event loop and stall every other request — logins, other teachers'
    dashboards, everything — for the duration of each scan. A plain `def`
    lets FastAPI dispatch it to its worker thread pool instead, so one
    classroom's recognition doesn't freeze the whole server for everyone
    else hitting it at the same time.
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(frame.file.read())
        tmp_path = tmp.name

    try:
        crops = get_face_crops(tmp_path, _model, conf_threshold=0.2, imgsz=1280)
    finally:
        os.remove(tmp_path)

    known_embeddings = load_known_embeddings()

    roster_ids = {
        e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    }
    roster_embeddings = {sid: emb for sid, emb in known_embeddings.items() if sid in roster_ids}

    recognized = []
    for crop in crops:
        embedding = get_embedding(crop)
        if embedding is None:
            continue

        best_id, best_sim = None, -1.0
        for student_id, known_emb in roster_embeddings.items():
            sim = float(np.dot(embedding, known_emb))
            if sim > best_sim:
                best_id, best_sim = student_id, sim

        if best_id and best_sim >= THRESHOLD:
            recognized.append({"student_id": best_id, "similarity": round(best_sim, 3)})

    return {"recognized": recognized}


@router.post("/save")
async def save_attendance(
    course_id: str = Form(...),
    statuses: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher, RoleEnum.admin)),
):
    """
    Supports both payload shapes:
    1) old: {"student_id": "present"}
    2) new: {"student_id": {"status":"present","similarity":0.78,"source":"ai"}}
    """
    import json

    try:
        status_map = json.loads(statuses)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid statuses JSON")

    if not isinstance(status_map, dict):
        raise HTTPException(status_code=400, detail="statuses must be an object")

    today = date.today()
    saved = 0

    roster_ids = {
        e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    }

    for student_id, raw in status_map.items():
        if student_id not in roster_ids:
            # skip non-roster IDs silently (or change to raise 400 if you prefer strict mode)
            continue

        # Backward compatible parse
        if isinstance(raw, str):
            status_value = raw
            similarity = None
            source = "manual"
        elif isinstance(raw, dict):
            status_value = raw.get("status", "absent")
            similarity = raw.get("similarity", None)
            source = raw.get("source", "manual")
        else:
            raise HTTPException(status_code=400, detail=f"Invalid status entry for {student_id}")

        try:
            status_enum = AttendanceStatus(status_value)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid attendance status '{status_value}' for {student_id}")

        marked_by = "ai" if source == "ai" else str(current_user.id)

        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.date == today,
        ).first()

        if existing:
            existing.status = status_enum
            existing.similarity = similarity
            existing.marked_by = marked_by
        else:
            db.add(
                AttendanceRecord(
                    student_id=student_id,
                    course_id=course_id,
                    date=today,
                    status=status_enum,
                    similarity=similarity,
                    marked_by=marked_by,
                )
            )

        saved += 1

    # Only log to the teacher's own activity feed when a teacher (not admin) took it.
    if current_user.role == RoleEnum.teacher and saved > 0:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        if teacher and course:
            log_teacher_activity(
                db, teacher.id, icon="check",
                title="Attendance taken",
                desc=f"{course.code} {course.name} · {saved} student{'s' if saved != 1 else ''}",
            )

    db.commit()
    return {"saved": saved}

@router.get("/today", response_model=AttendanceTodayResponse)
def get_today_attendance(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.teacher, RoleEnum.admin)),
):
    # Validate course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    today = date.today()

    rows = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.date == today,
        )
        .all()
    )

    return AttendanceTodayResponse(
        course_id=course_id,
        date=today.isoformat(),
        records=[
            AttendanceTodayItem(
                student_id=r.student_id,
                status=r.status.value if hasattr(r.status, "value") else str(r.status),
                similarity=r.similarity,
                marked_by=r.marked_by,
            )
            for r in rows
        ],
    )