# 03 — Alembic migrations

**Issue**: [#33](https://github.com/imsks/Saransh/issues/33) · **Type**: AFK · **Blocked by**: none · **Blocks**: 04, 07

Read [README.md](README.md) first.

## Why

`app/db/bootstrap.py:21` calls `Base.metadata.create_all(bind=engine)` on every startup. That has
two properties which are fine on a laptop and disqualifying in production:

- **It cannot alter anything.** `create_all` creates missing tables. It will not add a column,
  change a type, or add an index to a table that already exists. The moment the schema changes,
  production silently keeps the old shape and the app breaks on a column that isn't there.
- **It races.** Cloud Run starts instances concurrently. Several processes issuing `CREATE TABLE`
  against one database at once is a coin flip resolved by an exception in the loser's startup path.

Rajniti already uses Alembic. This is the tooling gap between the two products, and slices 04 and
07 both need a migration to exist before they can do anything.

## Current state

- `app/db/bootstrap.py` — `init_database()`, guarded only by a `SKIP_DB_AUTO_CREATE` env var, and
  it swallows failures with `logger.warning` so a broken database looks like a healthy boot
- `main.py` — calls `init_database()` from the startup event
- `app/db/models.py` — `Story`, `Source`, `Waitlist`; `uq_story_source_url` on `(story_id, url)`;
  an index on `sources.story_id`
- `tests/conftest.py` — builds schema from metadata for SQLite
- No `alembic.ini`, no `alembic/`

## What changes

Alembic is introduced with a baseline revision that reproduces the current schema exactly, so an
empty Postgres can be built from migrations alone. `create_all()` stops running in production.
Migrations become an explicit pre-deploy step, never an implicit startup side effect.

**Do not hand-write the baseline from memory.** Autogenerate it against a database built from
`Base.metadata`, then read the output and correct it — autogenerate is good at columns and poor at
constraint names, server defaults and index detail. The `server_default=func.now()` columns and the
named unique constraint are exactly where it slips.

## Action plan

1. Add Alembic (`alembic.ini` + `alembic/`) pinned in `requirements.txt`. `env.py` must read the
   URL from `app.config.settings` / `app.db.database`, not a literal in the ini file — the
   production URL is only ever an env var.
2. Point `target_metadata` at `Base.metadata` with `app.db.models` imported, so autogenerate sees
   all three tables.
3. Autogenerate the baseline revision against an empty Postgres, then verify by hand:
   UUID primary keys with `default=uuid.uuid4`, `server_default=func.now()` on the timestamp
   columns, the `uq_story_source_url` named constraint, the `sources.story_id` index, and the
   unique constraint on `waitlist.email`.
4. Gate `init_database()`: when `settings.is_production`, log and return without creating anything.
   Keep the existing `SKIP_DB_AUTO_CREATE` escape hatch for dev.
5. Add `make migrate` running `alembic upgrade head`.
6. Document in `CONTRIBUTING.md`: how to add a revision, how to run one locally, and that
   migrations are applied before a deploy, not by the app.
7. Test the thing that actually matters: apply `alembic upgrade head` to an empty database and
   assert the resulting schema matches `Base.metadata` — table names, column names and types,
   constraints. A drift test is the only thing that stops the migrations and the models diverging
   six months from now.

## Acceptance criteria

- [ ] Alembic configured, reading `DATABASE_URL` from app settings rather than `alembic.ini`
- [ ] Baseline revision creates `stories`, `sources`, `waitlist` identically to `app/db/models.py`,
      including `uq_story_source_url`, the `story_id` index, and the `waitlist.email` unique
- [ ] A test asserts `alembic upgrade head` produces a schema matching `Base.metadata` — not
      checked by eye
- [ ] `init_database()` creates nothing when `APP_ENV=production`
- [ ] `make migrate` runs `alembic upgrade head`
- [ ] `CONTRIBUTING.md` documents adding a revision and how migrations reach production
- [ ] `pytest tests/ -q` green

## How to verify

```bash
docker compose up -d postgres
DATABASE_URL=postgresql://rajniti:rajniti@127.0.0.1:5433/saransh alembic upgrade head
DATABASE_URL=... alembic downgrade base && DATABASE_URL=... alembic upgrade head   # round trip
APP_ENV=production python -c "from app.db.bootstrap import init_database; init_database()"  # creates nothing
```

## Out of scope

Any schema *change* — the unique index on `sources.url` belongs to slice 04. This slice only
captures what already exists.
