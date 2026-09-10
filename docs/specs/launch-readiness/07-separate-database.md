# 07 — Provision the separate Saransh database

**Issue**: [#37](https://github.com/imsks/Saransh/issues/37) · **Type**: HITL · **Blocked by**: 03 · **Blocks**: 09

Read [README.md](README.md) first. The reasoning lives in
[ADR 0003 — Separate Database for Saransh](../../adr/0003-separate-saransh-database.md).

## Why

`app/config.py:12` defaults `DATABASE_URL` to
`postgresql://postgres:postgres@127.0.0.1:5432/rajniti`, and `.env.example` points at the `rajniti`
database too. Saransh has been adding its tables to another product's database.

A default like that is how a misconfigured production service ends up writing into the wrong
product's data — it does not fail, it connects somewhere plausible and carries on. In production a
missing `DATABASE_URL` should be loud, not resourceful.

## Human judgement required

- Supabase console access to create the project or database and its role
- A decision about existing rows: what, if anything, in the shared Rajniti database is worth
  carrying across

## Action plan

1. Provision a separate Supabase project — or at minimum a separate database with its own role — for
   Saransh. Record the connection string wherever you keep secrets. Per D4 it will ride as a plain
   Cloud Run env var, so treat it as exposed to anyone with console access.
2. Apply the schema: `alembic upgrade head` against the new database (slice 03 makes this possible).
3. Audit what exists in the shared Rajniti database:
   ```sql
   SELECT count(*) FROM stories;
   SELECT count(*) FROM sources;
   SELECT count(*) FROM waitlist;
   ```
   Real Waitlist Signups are the rows that matter — those are people who asked to hear from you and
   cannot be recreated. Stories can be re-ingested. Migrate or consciously abandon, and **write the
   decision in a comment on the issue** so it is not rediscovered later as a mystery.
4. Remove the Rajniti default from `app/config.py`. In production, an unset `DATABASE_URL` should
   raise at startup with a clear message. Keep a working local default so `make up` still works out
   of the box against the compose Postgres.
5. Update `.env.example`.
6. Confirm the app runs against the new database end to end before slice 09 depends on it.

## Acceptance criteria

- [ ] Saransh database provisioned with its own credentials, distinct from Rajniti's
- [ ] `alembic upgrade head` applied successfully against it
- [ ] Existing rows audited; migrated or abandoned, with the decision recorded in an issue comment
- [ ] `app/config.py` no longer defaults to the Rajniti database
- [ ] Production startup fails with a clear error when `DATABASE_URL` is unset
- [ ] `make up` still works locally with no `.env` edits
- [ ] `.env.example` updated
- [ ] `pytest tests/ -q` green

## How to verify

```bash
DATABASE_URL='<new-url>' python -c "
from app.db.database import engine
from sqlalchemy import inspect
print(sorted(inspect(engine).get_table_names()))"     # stories, sources, waitlist

APP_ENV=production DATABASE_URL= python -c "import app.config"   # must fail loudly
```

## Out of scope

Cloud SQL, Secret Manager, read replicas, and any backup automation beyond what Supabase provides.
