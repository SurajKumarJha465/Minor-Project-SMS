# SSMS monorepo — merge + collaboration setup

## Merging tonight (one-time, do this once — not both of you separately)

Lovable's editor isn't in the picture anymore, so this is a copy-in, no
history preservation needed. `data/enrollment_photos/`, `known_embeddings.pkl`,
`models/`, and `test_images/` get copied in too — the app needs them to
actually run — they just stay listed in `.gitignore` so git never sees them.
Everything else genuinely doesn't need to make the trip (see the note at the
bottom of this file for why each exclude is there).

```bash
mkdir ~/ssms && cd ~/ssms
git init

# frontend — drop the old .git and Lovable metadata, skip node_modules/dist,
# keep the working files. uv/bun regenerate these from lockfiles anyway.
rsync -av \
  --exclude='.git' --exclude='.lovable' \
  --exclude='node_modules' --exclude='dist' \
  ~/Loveable/eduflow-hub/ ./frontend/

# backend — skip caches, .venv, and dev-only files. Real photos/models/
# embeddings/test_images ARE copied — they're required to run, just gitignored.
rsync -av \
  --exclude='__pycache__' --exclude='*.pyc' --exclude='.venv' \
  --exclude='SMS' --exclude='asset' \
  --exclude='debug' --exclude='attendance_logs' \
  --exclude='virekto_dump.md' --exclude='scrapper.py' --exclude='extract_code.py' \
  ~/PycharmProjects/Virekto/ ./backend/
```

`SMS/` is empty in the current tree — likely a leftover from before the
project was renamed. `asset/data/` and `asset/test_images/` duplicate the
top-level `data/`/`test_images/` — worth checking what's in there once,
rather than carrying the duplication forward.

Then drop these four files in at the paths shown alongside this doc:
```
  ./.gitignore                (root)
  ./backend/docker-compose.yml
  ./backend/.env.example
  ./SETUP.md                  (this file, root)
```

```bash
git add .
git commit -m "Merge frontend and backend into one repo"
```

Create a new **private** GitHub repo, push, then add your friend as a
collaborator. The old `eduflow-hub` and local `Virekto` folder can stay as-is
for reference — nothing forces you to delete them, just stop developing
against them.

## Final structure

```
ssms/
├── backend/
│   ├── api/                    # main.py, database.py, models.py, routers/, ...
│   ├── src/                    # detection.py, recognition.py, enroll_all.py, ...
│   ├── data/                   # gitignored — enrollment_photos/, known_embeddings.pkl
│   ├── models/                 # gitignored — yolov11s-face.pt
│   ├── test_images/            # gitignored — whole-class test fixtures
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── .env                    # gitignored — local values
│   └── pyproject.toml / uv.lock
├── frontend/
│   ├── src/, public/
│   └── package.json / bun.lock / vite.config.ts
├── .gitignore                  # root — covers both trees
└── SETUP.md
```

## One-time setup (both of you, after cloning)

```bash
git clone <new-ssms-repo-url> && cd ssms

cd backend
cp .env.example .env          # match JWT_SECRET_KEY / DATABASE_URL with each other
uv sync
docker compose up -d
uv run -m api.seed
uv run fastapi dev api/main.py

cd ../frontend
bun install
bun run dev
```

Cloning does NOT bring `data/enrollment_photos/`, `models/`, `known_embeddings.pkl`,
or `test_images/` — they're gitignored on purpose. See the Syncthing section
below; that's how your friend actually gets them.

## When your DB and your teammate's disagree

```bash
cd backend
docker compose down -v && docker compose up -d
uv run -m api.seed
```

## Tonight: real IT department data

Keep it out of `api/seed.py` (stays as CE demo data) — add a separate
`api/seed_it_dept.py` with the real roster and department id, drop photos
into `backend/data/enrollment_photos/<enrollment_id>/`, then
`uv run -m src.enroll_all` to regenerate embeddings.

## Enrollment photos, model weights, and other data that never goes to git

`data/enrollment_photos/`, `data/known_embeddings.pkl`, `models/`, and
`test_images/` are gitignored — real classmates' face photos, a generated
artifact, and large binary weights don't belong in a repo, private or not.
Since it's just the two of you, **Syncthing** is a good fit: direct
device-to-device sync, nothing sits on anyone else's server, and it also
solves tonight's real-data problem — new photos dropped into your
`data/enrollment_photos/` propagate to your friend's machine automatically.

1. Install on both machines (`sudo pacman -S syncthing` on Arch; installers
   exist for whatever your friend runs).
2. Add each other as devices — easiest in person, or by exchanging device IDs.
3. Share `backend/data/` and `backend/models/` as Send & Receive folders.

This is also how your friend gets the *initial* copy of these files —
`git clone` never brings gitignored content, so Syncthing isn't just for
ongoing updates, it's the only way they get a working local setup at all.

## Other fixes worth making while you're in here

- `allow_origins=["*"]` + `allow_credentials=True` in `api/main.py` is an
  invalid CORS combination — drop `allow_credentials=True` or list explicit
  origins via the new `CORS_ORIGINS` env var.
- `api/seed1.py` is a dead stub pointing at `seed.py` — safe to delete.
- `pyproject.toml` pins `requires-python >=3.14` — confirm your friend's
  `uv` resolves that before you're mid-collaboration.

## Deployment (defense day)

Not tonight's problem — handle it in one dedicated dry-run session a day or
two before the defense, at the actual venue if you can swing it.

The board (HikVision, Android, own browser, own camera, own hotspot) is the
client — it loads the site in its own browser and uses its own outward-facing
camera. Your laptop stays the server, since the recognition pipeline needs
your RTX 4050 (insightface + onnxruntime-gpu) — that part can't move to the
board. No real cloud deployment needed; this is just "make the backend and
frontend reachable over a local network instead of only `localhost`."

**Networking**: use the board's own hotspot rather than your laptop's or the
venue's wifi — it's the one piece of network infrastructure guaranteed to be
in the room and under your control, and it sidesteps any campus-wifi client
isolation risk entirely.

1. Turn on the board's hotspot; connect your laptop to it.
2. Find your laptop's IP on that network (`ip addr` / `ifconfig` on Linux).
3. Run the backend bound to all interfaces, not just localhost:
   `uv run fastapi run api/main.py --host 0.0.0.0 --port 8000`
4. Production-build and serve the frontend, also bound to all interfaces:
   `bun run build && bun run preview --host`
5. Add the board's browser origin to `CORS_ORIGINS` in `backend/.env`:
   `CORS_ORIGINS=http://<your-laptop-ip>:<frontend-port>`
   (restart the backend after editing `.env`)
6. On the board, open its browser to `http://<your-laptop-ip>:<frontend-port>`,
   log in, open the attendance page, and grant camera permission when
   prompted — that's the board's own camera now, not your laptop's webcam.

Test this exact sequence once well before the day, not for the first time
during it — Android hotspot behavior and IP assignment can vary, and you want
that discovered during a dry run, not mid-defense.
