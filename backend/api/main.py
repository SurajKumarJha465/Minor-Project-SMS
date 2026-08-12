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

# Comma-separated list of exact origins allowed to call this API, e.g.:
#   ALLOWED_ORIGINS="http://localhost:5173,http://192.168.1.50:4173"
# Falls back to common local-dev origins if unset. allow_origins=["*"] is
# invalid together with allow_credentials=True per the CORS spec, so this
# must be an explicit list, not a wildcard.
_default_origins = (
    "https://campus-comm-space.lovable.app,"
    "http://localhost:5173,http://localhost:4173,"
    "http://127.0.0.1:5173,http://127.0.0.1:4173"
)
allowed_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

# Profile pictures (HOD, teacher, admin, etc.) uploaded via the various
# "/me/photo" endpoints, served back out at "/uploads/profile-photos/<file>".
PROFILE_PHOTOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "profile_photos")
os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)
app.mount("/uploads/profile-photos", StaticFiles(directory=PROFILE_PHOTOS_DIR), name="profile_photos")


@app.get("/")
def health_check():
    return {"status": "ok"}