from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.database import engine, Base
from api.routers import attendance, roster
from api.routers import auth_router
from api.routers import admin
from api.routers import hod
from api.routers import teacher

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


@app.get("/")
def health_check():
    return {"status": "ok"}