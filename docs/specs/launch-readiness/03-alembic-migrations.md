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

This slice also carries the **health check**, which was previously tracked on its own issue.
`app/api/common.py` returns a hardcoded `{"status": "healthy"}` without touching Postgres. A health
check that reports healthy without checking its dependencies is worse than none at all: Cloud Run
will treat a service with an unreachable database as live and route traffic to it. It belongs here
because it is the other half of "the database is wired up correctly".

## Current state

Alembic is **partially** adopted — it was introduced after this spec was written, and what exists
does not yet meet the bar:

- `alembic.ini` and `alembic/versions/` exist, with three revisions
- `000000000000_existing_schema_baseline.py` has an **empty `upgrade()`**. It stamps a starting
  point against a database that already has tables; it cannot build one
- `92bc25c70312` and `a1b2c3d4e5f6` only *drop* columns. So `alembic upgrade head` against an empty
  Postgres creates nothing, then fails dropping columns that were never created
- `app/db/bootstrap.py` — `init_database()` still calls `create_all()`, guarded only by a
  `SKIP_DB_AUTO_CREATE` env var and not by `APP_ENV`, and it swallows failures with
  `logger.warning` so a broken database looks like a healthy boot
- `main.py` — calls `init_database()` from the startup event
- `app/api/common.py` — `/health` returns a static payload; no query, always 200
- `app/db/models.py` — `Story`, `Source`, `Waitlist`; `uq_story_source_url` on `(story_id, url)`;
  an index on `sources.story_id`
- `tests/conftest.py` — builds schema from metadata for SQLite
- No `make migrate` target; `CONTRIBUTING.md` says nothing about revisions

## What changes

The baseline is replaced with one that reproduces the current schema exactly, so an empty Postgres
can be built from migrations alone, and the existing drop-column revisions still apply cleanly on
top of it. `create_all()` stops running in production. Migrations become an explicit pre-deploy
step, never an implicit startup side effect. And `/health` starts telling the truth.

**Do not hand-write the baseline from memory.** Autogenerate it against a database built from
`Base.metadata`, then read the output and correct it — autogenerate is good at columns and poor at
constraint names, server defaults and index detail. The `server_default=func.now()` columns and the
named unique constraint are exactly where it slips.

Note the ordering trap: the current `000000000000` is already stamped in any database that has run
migrations. Either give the real baseline that same revision id, or add it *before* `000000000000`
and leave the empty one as a no-op in the chain. Do not silently renumber a revision that other
databases have already recorded.

## Action plan

1. Confirm Alembic's `env.py` reads the URL from `app.config.settings` / `app.db.database`, not a
   literal in the ini file — the production URL is only ever an env var.
2. Point `target_metadata` at `Base.metadata` with `app.db.models` imported, so autogenerate sees
   all three tables.
3. Autogenerate a real baseline against an empty Postgres, then verify by hand:
   UUID primary keys with `default=uuid.uuid4`, `server_default=func.now()` on the timestamp
   columns, the `uq_story_source_url` named constraint, the `sources.story_id` index, and the
   unique constraint on `waitlist.email`. Slot it into the chain ahead of the existing
   drop-column revisions and confirm they still apply.
4. Gate `init_database()`: when `settings.is_production`, log and return without creating anything.
   Keep the existing `SKIP_DB_AUTO_CREATE` escape hatch for dev.
5. Add `make migrate` running `alembic upgrade head`.
6. Make `/health` execute a real query (`SELECT 1`) against the session, and return a non-success
   status when it raises. Keep the existing payload shape; add the database result to it.
7. Document in `CONTRIBUTING.md`: how to add a revision, how to run one locally, and that
   migrations are applied before a deploy, not by the app.
8. Test the thing that actually matters: apply `alembic upgrade head` to an empty database and
   assert the resulting schema matches `Base.metadata` — table names, column names and types,
   constraints. A drift test is the only thing that stops the migrations and the models diverging
   six months from now.

## Acceptance criteria

- [ ] Alembic configured, reading `DATABASE_URL` from app settings rather than `alembic.ini`
- [ ] A baseline revision **creates** `stories`, `sources`, `waitlist` identically to
      `app/db/models.py`, including `uq_story_source_url`, the `story_id` index, and the
      `waitlist.email` unique
- [ ] The existing drop-column revisions still apply cleanly in sequence from that baseline
- [ ] A test asserts `alembic upgrade head` produces a schema matching `Base.metadata` — not
      checked by eye
- [ ] `init_database()` creates nothing when `APP_ENV=production`
- [ ] `make migrate` runs `alembic upgrade head`
- [ ] `GET /api/v1/health` executes a real query and returns a non-success status when the database
      is unreachable — verified against a bad connection string, not only a mocked session
- [ ] `CONTRIBUTING.md` documents adding a revision and how migrations reach production
- [ ] `pytest tests/ -q` green

## How to verify

```bash
docker compose up -d postgres
DATABASE_URL=postgresql://rajniti:rajniti@127.0.0.1:5433/saransh alembic upgrade head
DATABASE_URL=... alembic downgrade base && DATABASE_URL=... alembic upgrade head   # round trip
APP_ENV=production python -c "from app.db.bootstrap import init_database; init_database()"  # creates nothing

# health check tells the truth
curl -s localhost:8001/api/v1/health                                    # healthy
DATABASE_URL=postgresql://nope:nope@127.0.0.1:1/nope make up && \
  curl -s -o /dev/null -w '%{http_code}\n' localhost:8001/api/v1/health # non-2xx
```

## Out of scope

Any schema *change* — the unique index on `sources.url` belongs to slice 04. This slice only
captures what already exists.

---

*Updated 2026-09-16 during a backlog audit: Alembic had been partially adopted since this spec was
written, and the health-check requirement was inherited from a deleted issue whose migration half
had already shipped. See the audit comment on
[#41](https://github.com/imsks/Saransh/issues/41).*
