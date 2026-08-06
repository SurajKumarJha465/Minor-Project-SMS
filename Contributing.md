# Contributing

## Branching

`main` is protected — no direct pushes. Branch off it:

```
feature/<short-description>   # new functionality
fix/<short-description>       # bug fixes
chore/<short-description>     # tooling, deps, config
```

Examples: `feature/hod-results-view`, `fix/sidebar-nav-bug`.

## Commits

Use conventional-ish prefixes so history stays scannable:

```
feat: add HOD results aggregate view
fix: resolve navigation crash in HodSidebar
chore: bump fastapi to 0.115
docs: update backend setup instructions
```

## Pull requests

1. Branch off latest `main`.
2. Keep PRs scoped to one feature/fix — small PRs get reviewed faster.
3. Fill out the PR template (what changed, how to test).
4. At least one review required before merge (see branch protection).
5. Squash-merge into `main` to keep history clean.

## Backend-specific

- Use absolute imports: `from api.module import ...`
- Run modules with `-m`: `uv run python -m api.seed`, not `python api/seed.py`
- New DB models go in `api/models.py`; write a matching migration if using
  Alembic, or note the schema change in the PR description if not yet set up.
- Never commit `.env`, enrollment photos, embeddings, or model weights.

## Frontend-specific

- Match existing component patterns in `src/`.
- Run `bun run lint` before pushing.
- Keep new pages under the existing role-based routing structure
  (`admin.*`, `hod.*`, `teacher.*`).

## Before you push, always check

```bash
git status
git diff --stat
```
to make sure you're not accidentally staging `node_modules`, `.venv`,
`.env`, or data files that should be gitignored.