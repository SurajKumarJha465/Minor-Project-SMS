# Smart Student Management System (SSMS)

Full-stack academic platform with face-recognition attendance, role-based
access (Admin / HOD / Teacher), course & enrollment management, and marks
publishing.

## Structure

```
Minor-Project-SMS/
├── backend/    FastAPI + PostgreSQL API ("Virekto")
├── frontend/   React + TypeScript SPA ("eduflow-hub")
└── docs/       ER diagrams, design notes
```

## Prerequisites

- Python 3.13+ and [uv](https://docs.astral.sh/uv/)
- [Bun](https://bun.sh/)
- PostgreSQL 15+ running locally (or a connection string to one)

## Backend setup

```bash
cd backend
cp .env.example .env      # fill in your DB URL and secrets
uv sync
uv run python -m api.seed # seed initial data
uv run uvicorn api.main:app --reload
```
API runs at `http://localhost:8000`. Interactive docs at `/docs`.

**Note:** face-recognition weights (`models/yolov11s-face.pt`) and student
enrollment photos are excluded from git for privacy and size reasons.
Ask [your name/contact] for access to these — they need to be placed at
`backend/models/` and `backend/data/enrollment_photos/` respectively before
the attendance module will work.

## Frontend setup

```bash
cd frontend
cp .env.example .env.local
bun install
bun run dev
```
Runs at `http://localhost:5173` by default.

## Tech stack

| Layer    | Stack |
|----------|-------|
| Backend  | FastAPI, SQLAlchemy, PostgreSQL, JWT auth, YOLOv11 + ArcFace |
| Frontend | React, TypeScript, Vite, Tailwind |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit
conventions, and the PR process.