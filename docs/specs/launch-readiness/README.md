# Launch Readiness — Saransh API on GCP

**Status**: Approved, not started · **Parent issue**: [imsks/Saransh#41](https://github.com/imsks/Saransh/issues/41) · **Written**: 2026-09-02

Everything needed to take the Saransh backend from "runs on a laptop" to "serving the public
internet from Cloud Run", plus the cross-promo link from Rajniti. Ten slices in this repo, one
in Rajniti. Each slice is a separate spec file in this directory and a sub-issue of the parent.

Read this file first. It carries the shared context every slice assumes; the slice specs do not
repeat it.

---

## 1. Where the code actually is today

This matters because the original framing of this work was wrong in ways worth recording.

**The Story Ingest API exists.** `app/api/stories.py` serves `GET /api/stories`,
`GET /api/stories/{id}` and `POST /api/stories`. The POST is guarded by an `X-API-Key` header
checked against `SARANSH_INGEST_API_KEY`.

**The Waitlist API exists, in FastAPI.** `app/api/waitlist.py` serves `POST /api/v1/waitlist`,
normalises the email, and treats a repeat signup as success (`{ok: true, duplicate: true}`) via
the unique constraint on `waitlist.email`. It is wired up in `app/api/__init__.py` and covered by
`tests/test_waitlist.py`.

**There are no Next.js API routes to migrate.** `frontend/src/app` has no `api/` directory. The
only server-side indirection is the rewrite block in `frontend/next.config.mjs`, which proxies
`/api/v1/*` and `/api/stories*` through to FastAPI so that SSR can reach the API inside Docker.
The "FastAPI only, no Next APIs" requirement is already satisfied — nothing to remove.

**Nothing is deployed.** There is no deploy workflow, no `cloudbuild.yaml`, and no gcloud script
in this repo or in Rajniti. Rajniti's Dockerfile has a comment reading
`# ── Production (Cloud Run / Supabase) ──`, and that comment is the entirety of the documented
deployment story for either product. Slice 08 is what makes "the same way as Rajniti" a real
thing rather than a memory.

**The suite is green.** 64 tests pass in well under a second (`pytest tests/ -q`). Keep it that
way — every slice adds tests and none should slow the suite meaningfully, because it is fast
enough right now to run on every save.

## 2. What the grilling surfaced that nobody had named

Three defects came out of stress-testing the plan rather than from the original request. They are
the reason this is a hardening pass and not a feature build.

1. **Drafts are public.** `POST /stories` writes `status="draft"`, and `list_stories` applies no
   status filter unless a caller passes one. Every unreviewed Story an ingestion Agent produces is
   readable by anyone who can reach the API. → Slice 05.
2. **Ingest is not idempotent.** An Agent that retries after a timeout creates a second Story. The
   only uniqueness in the schema is `uq_story_source_url` on `(story_id, url)`, which by
   construction cannot collide across two separate inserts. → Slice 04.
3. **The container cannot serve on Cloud Run.** CORS is hardcoded to `http://localhost:3001` in
   `main.py`, so a browser on any deployed origin is blocked; and while the production `CMD` binds
   `${PORT:-8001}`, the `EXPOSE` and healthcheck assume 8001 while Cloud Run injects `PORT=8080`.
   → Slice 01.

## 3. Decisions

Settled during the grilling session on 2026-09-02. Do not relitigate these inside a slice — if one
turns out to be wrong, say so on the parent issue.

| # | Decision | Why |
|---|---|---|
| D1 | This is a refactor and hardening pass, not net-new endpoints | Both APIs already exist and are tested |
| D2 | One surface under `/api/v1`; `/api/stories` stays as a deprecated alias for one release | Two conventions for one service is a caller-facing wart; the alias avoids a flag-day break |
| D3 | Saransh gets its own database (Supabase), not Rajniti's | See [ADR 0003](../../adr/0003-separate-saransh-database.md) |
| D4 | Secrets ride as plain Cloud Run env vars for now, not Secret Manager | Accepted trade-off: values visible in the console and in shell history. Moving to Secret Manager later is a service-config change, not a code change |
| D5 | Alembic owns the schema; `create_all()` is demoted to dev and test | `create_all` cannot alter a column and races across instances |
| D6 | Deploy via a committed script that a human triggers, not CI | Matches how Rajniti is deployed today. CI promotion is a later step, deliberately not in scope |
| D7 | Frontend on Vercel, browser calls Cloud Run directly | Matches Rajniti's hosting; needs env-driven CORS rather than a proxy hop |
| D8 | Waitlist guarded by IP rate limit + honeypot, not a captcha | No third-party dependency, no account, no UX cost |
| D9 | Public reads return `published` Stories only; drafts need the API key | Closes the draft leak without inventing an admin auth system |
| D10 | Ingest dedupes on source URL, replay returns the existing Story with 200 | A given article URL belongs to exactly one Story — a natural key needing no client change |
| D11 | Rajniti links out to Saransh; no waitlist form embedded in Rajniti | Keeps the waitlist write path in one product |

## 4. Vocabulary

From `CONTEXT.md`. Use these words in code, commits, issue comments and PR titles.

- **Story** — a news event with headline, summary, Sources and metadata. Not "article", not "post".
- **Source** — a verified outlet an Article came from. Not "publisher", not "feed".
- **Ingest** — accepting a structured Story with its Sources from an Agent over the API. An
  ingested Story enters as a Draft. Not "upload", not "submit".
- **Publication Status** — where a Story sits in its lifecycle. A **Draft** is ingested but not
  publicly readable; a **Published** Story is visible to readers. Note that `state` is already
  taken: on the `Story` model it means the Indian state the Story is about. Never use "state" for
  the lifecycle.
- **Waitlist Signup** — a person who asked to be told when Saransh launches. Identified by email;
  signing up twice is the same Signup, not two. Not "subscriber", not "lead".

## 5. Execution order

```
        ┌── 01 runtime contract ──┐
        │                          └── 08 deploy tooling ──┐
        ├── 02 /api/v1 surface ─── 05 publication status    ├── 09 first deploy ── 10 frontend
        │                                                   │
        ├── 03 alembic ──┬── 04 ingest dedupe               │
        │                └── 07 separate database ──────────┘
        └── 06 waitlist guard

  (Rajniti) 11 cross-promo — independent, but its link only resolves once 10 lands
```

Five slices have no blockers and can run in parallel: **01, 02, 03, 06** and Rajniti **11**.

| Slice | Spec | Issue | Type | Blocked by |
|---|---|---|---|---|
| 01 Cloud Run runtime contract | [01-cloud-run-runtime.md](01-cloud-run-runtime.md) | [#31](https://github.com/imsks/Saransh/issues/31) | AFK | — |
| 02 Unify on `/api/v1` | [02-api-v1-surface.md](02-api-v1-surface.md) | [#32](https://github.com/imsks/Saransh/issues/32) | AFK | — |
| 03 Alembic migrations | [03-alembic-migrations.md](03-alembic-migrations.md) | [#33](https://github.com/imsks/Saransh/issues/33) | AFK | — |
| 04 Ingest dedupe | [04-ingest-dedupe.md](04-ingest-dedupe.md) | [#35](https://github.com/imsks/Saransh/issues/35) | AFK | 03 |
| 05 Publication Status | [05-publication-status.md](05-publication-status.md) | [#36](https://github.com/imsks/Saransh/issues/36) | AFK | 02 |
| 06 Waitlist abuse guard | [06-waitlist-abuse-guard.md](06-waitlist-abuse-guard.md) | [#34](https://github.com/imsks/Saransh/issues/34) | AFK | — |
| 07 Separate database | [07-separate-database.md](07-separate-database.md) | [#37](https://github.com/imsks/Saransh/issues/37) | HITL | 03 |
| 08 Deploy tooling | [08-deploy-tooling.md](08-deploy-tooling.md) | [#38](https://github.com/imsks/Saransh/issues/38) | AFK | 01 |
| 09 First production deploy | [09-first-deploy.md](09-first-deploy.md) | [#39](https://github.com/imsks/Saransh/issues/39) | HITL | 07, 08 |
| 10 Frontend to Vercel | [10-frontend-vercel.md](10-frontend-vercel.md) | [#40](https://github.com/imsks/Saransh/issues/40) | HITL | 09 |
| 11 Rajniti cross-promo | [`docs/specs/saransh-cross-promo.md`](https://github.com/imsks/Rajniti/blob/development/docs/specs/saransh-cross-promo.md) in imsks/Rajniti | [imsks/Rajniti#261](https://github.com/imsks/Rajniti/issues/261) | AFK | — |

**AFK** slices can be implemented and merged by an agent with no human in the loop. **HITL** slices
need credentials or a judgement call a human has to make — Supabase, GCP and Vercel access.

## 6. Picking up a slice locally

```bash
git clone git@github.com:imsks/Saransh.git && cd Saransh
make up                    # API :8001, frontend :3001, Postgres :5433
pytest tests/ -q           # 64 passing before you touch anything
```

`make up` copies `.env.example` to `.env` if absent and starts everything in Docker. The API is at
`http://localhost:8001`, docs at `http://localhost:8001/docs`.

Then:

1. Read this file, then your slice's spec.
2. Branch from `master`: `git checkout -b slice-NN-short-name`.
3. Work through the slice's action plan. Add the tests it names — they are part of the slice, not
   a follow-up.
4. `pytest tests/ -q` green, plus `black`, `isort` and `flake8` over `app tests scripts` (see
   `.pre-commit-config.yaml`; CI runs all four).
5. For frontend changes: `cd frontend && npm test && npm run lint`.
6. Open a PR that says "Closes #NN".

**House style**, from the existing code: SQLAlchemy models with explicit `Column(...)` calls;
Pydantic v2 (`field_validator`, `model_config = {"from_attributes": True}`); routers export a
`router` and are composed in `app/api/__init__.py`; tests are plain pytest with a FastAPI
`TestClient` and a SQLite session fixture (`tests/conftest.py`). Match it.

## 7. Definition of done for the whole epic

- [ ] `https://<cloud-run-url>/api/v1/health` returns healthy over HTTPS
- [ ] The public Story feed returns Published Stories only; Drafts require the API key
- [ ] Ingest is idempotent — a replayed POST returns the existing Story, not a duplicate
- [ ] A Waitlist Signup from the deployed frontend persists, and a replay reports `duplicate`
- [ ] The schema is reproducible from `alembic upgrade head` against an empty database
- [ ] Saransh is on its own database; no credential is shared with Rajniti
- [ ] A second person can deploy from `docs/DEPLOYMENT.md` without asking anyone a question
- [ ] Rajniti's marketing page links to a Saransh site that actually loads

## 8. Deliberately out of scope

Named here so nobody widens a slice to include them:

- GitHub Actions or Cloud Build CI deployment (D6 — a later step, once a manual deploy works)
- Secret Manager (D4)
- Admin UI for reviewing and publishing Drafts — the publish transition in slice 05 is an API call
- The Story↔representative cross-link between Saransh and Rajniti (ADR 0003 fixes it as an HTTP
  call, but nothing implements it yet)
- Confirmation or launch emails to Waitlist Signups
- Scrapers, chunking, embeddings and the Agent pipeline — `app/scrapers`, `app/processors`,
  `app/ai` and `app/agents` are empty and stay that way here
