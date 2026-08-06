## Local DB + Seed

```bash
docker run \
  --name ssms-postgres \
  -e POSTGRES_USER=ssms_user \
  -e POSTGRES_PASSWORD=ssms_pass \
  -e POSTGRES_DB=ssms_db \
  -p 5432:5432 \
  -d \
  postgres:16
```

Seed data:

```bash
uv run -m api.seed
```

Demo logins (password: `123456`):
- admin@ssms.edu
- hod@ssms.edu
- teacher@ssms.edu
- student@ssms.edu