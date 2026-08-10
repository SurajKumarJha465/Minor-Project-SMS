import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.database import engine, Base
from api.routers import attendance, roster
from api.routers import auth_router
from api.routers import admin
from api.routers import hod
from api.routers import teacher
from api.routers import student

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Virekto / SSMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your actual frontend URL (e.g. http://localhost:5173) once deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attendance.router)
app.include_router(roster.router)
app.include_router(auth_router.router)
app.include_router(admin.router)
app.include_router(hod.router)
app.include_router(teacher.router)
app.include_router(student.router)

# Serves uploaded notice attachments back out at the URLs hod.py hands out
# (e.g. "/uploads/notices/<file>"). Matches the backend/data/ convention
# already used for face-recognition enrollment photos.
NOTICE_ATTACHMENTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "notice_attachments")
os.makedirs(NOTICE_ATTACHMENTS_DIR, exist_ok=True)
app.mount("/uploads/notices", StaticFiles(directory=NOTICE_ATTACHMENTS_DIR), name="notice_attachments")


@app.get("/")
def health_check():
    return {"status": "ok"}