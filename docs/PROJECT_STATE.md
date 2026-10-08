# Saransh — Project State

**What this is:** one document describing everything that is built in this repository today, backend and frontend, and how it is built. It is meant to be the starting point for anyone (a founder, a contributor, a non-technical reader, or an AI assistant) who needs to build on top of what exists.

**Last verified against the code:** 2026-10-08, at commit `4d91910` on `development`. Application code is unchanged since then; `771bbac` added this file, and every other doc in the repository was brought in line with it the same day.
**Product direction last updated:** 2026-10-08 (section 14, including the decisions closed later that day). Owner: Pratyusha Trivedi.

**Scope rule:** sections 1–13 describe only what exists in the code. Planned work lives in section 14 of this file, in `docs/adr/`, and in PRD v1.1 (kept by the founder, outside this repository). Where the code differs from what the landing page or other docs say, the difference is listed in [section 11](#11-known-gaps-and-things-that-will-surprise-you). Earlier versions of this file pointed to `docs/specs/launch-readiness/`; that folder is not in the repository, so a mention of "spec 03", "spec 04" and so on names a planned item, not a file you can open.

> **Read section 14 first if you are building something new.** On 8 Oct 2026 the product pivoted from district news to a national news app. The code below still reflects the earlier plan in places (the `district` column, the old positioning line, the old topic set). Section 14 lists what the code must change. The 8 Oct update to this file is documentation only: no code was changed.

---

## Contents

1. [Plain-language summary](#1-plain-language-summary)
2. [Status at a glance](#2-status-at-a-glance)
3. [Architecture](#3-architecture)
4. [Repository map](#4-repository-map)
5. [Backend](#5-backend)
6. [Data: what is stored and where](#6-data-what-is-stored-and-where)
7. [How news gets in (ingestion)](#7-how-news-gets-in-ingestion)
8. [Frontend](#8-frontend)
9. [Sutra UI and theming](#9-sutra-ui-and-theming)
10. [Running, testing, deploying](#10-running-testing-deploying)
11. [Known gaps and things that will surprise you](#11-known-gaps-and-things-that-will-surprise-you)
12. [How to build on top of this](#12-how-to-build-on-top-of-this)
13. [Keeping this document current](#13-keeping-this-document-current)
14. [Product direction and the gap to close (8 Oct 2026)](#14-product-direction-and-the-gap-to-close-8-oct-2026)

---

## 1. Plain-language summary

Saransh is an open-source news app for India: short, attributed summaries of news stories in Hindi and English, each linked to the source it came from, with no personalisation. The product rule is that nothing is published until a person has reviewed it; that rule is not yet true of the code (see below).

What exists today is the foundation, not the product:

- **A landing page** that explains Saransh, shows a story preview and collects waitlist signups (name and email), plus a **privacy page**.
- **A small backend service** that can (a) save waitlist signups, (b) accept a finished news story from an outside program and store it, and (c) hand stored stories back to anyone who asks.
- **A database** with three tables: stories, the sources behind each story, and the waitlist. In production it is hosted on Supabase and shared with Rajniti (section 6).
- **The plumbing** to run all of this locally with one command, test it automatically, and deploy it.

How stories get in today: a scheduled Claude Code routine, documented in `docs/story-ingest-routine.md`, finds news, writes the summaries and sends them to the backend. Each story is **published the moment it arrives**. This is a stopgap that the founder has chosen to keep until the real pipeline exists (section 14.9). It is not the planned pipeline, and nobody reviews these stories before they go live.

What does **not** exist yet: the planned pipeline (approved RSS sources, local AI summaries, an agent check, human review), a screen for a reviewer to approve stories, a reader-facing news feed, user accounts, analytics, and emails.

---

## 2. Status at a glance

| Area | State | Notes |
|---|---|---|
| Landing page | Built | `/`. Light and dark themes. Copy predates the 8 Oct pivot (section 14). |
| Privacy page | Built | `/privacy`, linked from the footer. Describes PostHog analytics that are not in the code yet (section 11). |
| Waitlist signup | Built end to end | Form → API → `waitlist` table. Duplicate emails are treated as success. |
| Story ingest API | Built | `POST /api/v1/stories`, protected by an API key. Always saves as **published**. |
| Story read API | Built | List (filters + pagination) and single-story lookup. Public. |
| Story preview on landing page | Built | Shows the three newest published stories from the API on the v1.2 app story card; falls back to three hardcoded samples when the API returns none. |
| Stopgap ingest routine | Documented | A prompt in `docs/story-ingest-routine.md` for a scheduled Claude Code routine. The repository cannot tell you whether it is scheduled. |
| Review before publish (draft → published) | Not built | Ingest writes `published` directly. There is no draft stage, no review screen and no publish action. |
| Planned pipeline (RSS, local AI, agent check) | Not built | `app/agents/` is an empty package. |
| Reviewer/admin UI | Not built | |
| Reader news feed, story pages | Not built | |
| Accounts, sign-in | Not built | Decided in ADR 0005 and ADR 0006. The Google OAuth client is provisioned by hand (`docs/google-oauth-setup.md`); no code reads the keys yet, and the repository cannot tell you whether the console work was done. |
| Analytics | Not built | Decided in ADR 0004 (PostHog). To be implemented as the privacy page describes. |
| Rajniti cross-linking | Not built | The landing page shows a static mock-up of it. Now planned for V2. |
| Database migrations (Alembic) | Set up | Nine revisions. See caveat in section 6. |
| Local dev (Docker) | Built | `make up` starts API, frontend and Postgres. |
| CI | Built | Tests, lint, typecheck, frontend build on every PR. |
| Deploy tooling | Built | `make deploy` → Cloud Run script, which also applies migrations. Frontend is configured for Vercel. |

---

## 3. Architecture

```
                         Browser
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │  Frontend — Next.js 14 (App Router)  │   port 3001 locally, Vercel in production
        │  two pages: landing page, /privacy   │
        └──────────────────────────────────────┘
              │                        │
              │ waitlist POST          │ server-side fetch of published
              │ (from the browser)     │ stories (cached 60s)
              ▼                        ▼
        ┌──────────────────────────────────────┐
        │  Backend — FastAPI, mounted at       │   port 8001 locally, Cloud Run in production
        │  /api/v1                             │
        └──────────────────────────────────────┘
              ▲                        │
              │ POST /stories          │ SQLAlchemy
              │ + X-API-Key            ▼
   ┌──────────────────────┐   ┌──────────────────┐
   │ External ingest      │   │  PostgreSQL      │   port 5433 locally, Supabase in production
   │ agent: a scheduled   │   │  stories         │
   │ Claude Code routine  │   │  sources         │
   │ (prompt in docs/)    │   │  waitlist        │
   └──────────────────────┘   └──────────────────┘
```

Key design decisions already made (see `docs/adr/`):

- **FastAPI, not Flask** (ADR 0001), because the eventual workload is I/O-heavy.
- **Each repo runs on its own** with `make up`; no cross-repo dev orchestration (ADR 0002).
- **One production database, shared with Rajniti** (ADR 0006, which supersedes ADR 0003; confirmed by the founder on 8 Oct 2026). Rajniti owns the single `users` table; Saransh owns `stories`, `sources`, `waitlist` and, when built, `saransh_user_preferences`. Each product's migrations may only touch its own tables. Saransh tracks its migrations in its own version table, `alembic_version_saransh`.
- **PostHog for analytics**, not Google Analytics (ADR 0004). Not in the code yet.
- **The backend verifies who the user is**; it does not trust an id sent by the browser (ADR 0005). Not in the code yet.
- **The frontend has no API routes of its own today.** Every data call goes to FastAPI. Next.js only *proxies* `/api/v1/*` to the backend. ADR 0005 plans thin Next.js Route Handlers for signed-in data, and ADR 0004 plans a second rewrite that proxies analytics requests; neither exists yet.
- **What Saransh and Rajniti share:** the UI library (Sutra) and, in production, the database with its `users` table. They do not share backend code, and neither product reads the other's tables apart from `users`.

### Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2, psycopg2, structlog, Uvicorn (dev) / Gunicorn + Uvicorn worker (prod) |
| Database | PostgreSQL 16 locally; Postgres hosted on Supabase in production (database only, through the session-mode pooler, no Supabase Auth or SDK); Alembic for migrations; SQLite in-memory for tests |
| Frontend | Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS v4, `@sutra_ui/ui` + `@sutra_ui/tokens`, pino (logging), Vitest |
| Infra | Docker + Docker Compose, Makefile, GitHub Actions, Google Cloud Run (API), Vercel (frontend), Supabase (production Postgres) |

---

## 4. Repository map

```
Saransh/
├── main.py                    FastAPI app: CORS, router mount, startup hook
├── app/
│   ├── config.py              Settings from environment variables
│   ├── api/
│   │   ├── __init__.py        Composes the three routers into one
│   │   ├── common.py          GET /  and  GET /health
│   │   ├── stories.py         Story list / detail / ingest endpoints
│   │   ├── waitlist.py        Waitlist signup endpoint (+ its schemas)
│   │   └── dependencies.py    require_api_key (X-API-Key guard)
│   ├── schemas/stories.py     Pydantic request/response shapes for stories
│   ├── db/
│   │   ├── config.py          Fixes DATABASE_URL host for Docker vs host runs
│   │   ├── database.py        Engine, session factory, Base, get_db
│   │   ├── models.py          Story, Source, Waitlist tables
│   │   ├── bootstrap.py       create_all() on startup
│   │   └── repositories/stories.py   All story queries and writes
│   ├── utils/logging.py       structlog setup
│   └── agents/                Empty package (placeholder)
├── alembic/                   Migration environment + 9 revisions
├── scripts/
│   ├── init_db.py             Create tables manually
│   ├── deploy_cloud_run.sh    Build, push, deploy the API
│   └── generate_contributors.py   Writes frontend/src/data/contributors.json
├── tests/                     Backend tests (pytest)
├── frontend/
│   ├── next.config.mjs        /api/v1 rewrite (proxy) to the backend
│   ├── vercel.json            Security + cache headers
│   └── src/
│       ├── app/               layout.tsx, page.tsx, privacy/page.tsx, globals.css
│       ├── components/        layout, marketing, stories, waitlist, providers, seo
│       ├── lib/               api-base, stories, validate, logger, routes, seo/
│       ├── constants/stories.ts    Sample stories for the preview
│       └── data/contributors.json  Generated weekly
├── docs/                      DEPLOYMENT.md, story-ingest-routine.md, google-oauth-setup.md, adr/, this file
├── .github/                   CI workflows, PR template, AI agent briefs
├── Dockerfile                 API image: base → development / production
├── docker-compose.yml         Local stack: postgres + api + web
├── docker-compose.prod.yml    API only, production target
├── Makefile                   setup / up / stop / migrate / revision / deploy
├── CONTEXT.md                 Domain glossary (use these words)
└── CONTRIBUTING.md            Contribution rules
```

---

## 5. Backend

### 5.1 Entry point — `main.py`

Creates the FastAPI app and does four things:

1. Calls `setup_logging()` before anything else.
2. Adds CORS middleware: origins from `settings.CORS_ORIGINS`; methods `GET, POST, PATCH, OPTIONS`; all headers.
3. Mounts the combined router at **`/api/v1`**. Nothing is served outside that prefix (a test asserts `/api/stories` returns 404).
4. On startup, logs `app.startup` and calls `init_database()`.

Interactive API docs are at `/docs` (FastAPI default).

### 5.2 Configuration — `app/config.py`

A plain `Settings` class that reads environment variables once at import (via `python-dotenv`). There is one shared instance: `settings`.

| Variable | Default | Used for |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/rajniti` | Database connection |
| `APP_ENV` | `development` | `is_development` / `is_production`; picks log format |
| `DEBUG` | `True` | FastAPI debug flag |
| `LOG_LEVEL` | `INFO` | Log level |
| `HOST` / `PORT` | `0.0.0.0` / `8001` | Only when running `python main.py` |
| `CORS_ORIGINS` | `http://localhost:3001,http://127.0.0.1:3001` | Comma-separated allowed browser origins |
| `SARANSH_INGEST_API_KEY` | none | Secret for `POST /stories` |
| `SKIP_DB_AUTO_CREATE` | unset | If `1/true/yes`, skips table creation on startup (read in `bootstrap.py`) |

`build_cors_origins()` always appends the production frontend origin `https://saransh-app.vercel.app` to whatever is configured, de-duplicated. So that origin is allowed even if `CORS_ORIGINS` is empty.

### 5.3 API endpoints

All paths are under `/api/v1`.

| Method + path | Auth | File | What it does |
|---|---|---|---|
| `GET /` | Public | `api/common.py` | Welcome payload with version and environment |
| `GET /health` | Public | `api/common.py` | `{"status": "healthy", ...}` — used by health checks |
| `GET /stories` | Public | `api/stories.py` | List stories, newest first |
| `GET /stories/{story_id}` | Public | `api/stories.py` | One story by UUID, or 404 |
| `POST /stories` | `X-API-Key` | `api/stories.py` | Ingest one story with its sources |
| `POST /waitlist` | Public | `api/waitlist.py` | Add a waitlist signup |

**`GET /stories` query parameters:** `limit` (1–100, default 20), `offset` (≥0, default 0), and optional exact-match filters `category`, `state`, `district`, `status`. Ordering is `created_at` descending. With no `status` filter every status is returned; in practice every story is `published`, because ingest writes nothing else (section 7).

**`POST /stories` request body (`StoryIn`):**

```json
{
  "title_en": "…", "title_hi": "…",
  "summary_en": "…", "summary_hi": "…",
  "image_url": "https://…",     // required
  "source_url": "https://…",    // optional: the one article the summary was written from
  "category": "…",
  "state": "…",        // optional
  "district": "…",     // optional
  "sources": [
    { "outlet": "…", "url": "https://…", "source_type": "…" }   // source_type optional
  ]
}
```

Validation: the four text fields and `category` must be non-blank; `image_url` is required and must be a valid HTTP(S) URL; `source_url`, when sent, must be a valid HTTP(S) URL; `sources` must contain at least one item; each source `url` must be a valid HTTP(S) URL. Failures return 422. A missing or wrong key returns 401. A database failure returns 500 `"Failed to save story"`. Success returns 201 with the saved story. **There is no word-count check** (see 14.4), and nothing checks whose image `image_url` points to.

**Story response (`StoryOut`):** `id`, `title_en`, `title_hi`, `summary_en`, `summary_hi`, `image_url`, `source_url`, `category`, `state`, `district`, `status`, `sources[]` (`id`, `outlet`, `url`, `source_type`), `created_at`. `updated_at` is stored but not returned.

**`POST /waitlist` request body:** `{ "name": "…", "email": "…" }`. Extra fields are ignored.

| Outcome | Status | Body |
|---|---|---|
| New signup | 201 | `{"ok": true}` |
| Email already on the list | 200 | `{"ok": true, "duplicate": true}` |
| Name blank or under 2 characters, or invalid email | 422 | FastAPI validation error |
| Database error | 500 | `{"detail": "Unable to save your waitlist signup right now."}` |

The email is trimmed and lowercased before saving. Duplicate detection relies on the database's unique constraint on `email` (the insert fails with `IntegrityError`, which is caught and turned into the 200 response).

### 5.4 API key guard — `app/api/dependencies.py`

`require_api_key` reads the `X-API-Key` header and compares it to `SARANSH_INGEST_API_KEY` using a constant-time comparison. If the server has no key configured, **every** request is rejected (401), so an unset key fails closed. It is attached to `POST /stories` only.

### 5.5 Layering

The story feature shows the pattern to follow for new features:

```
api/stories.py            HTTP: parameters, status codes, errors, logging
   └── schemas/stories.py     Shapes: what comes in, what goes out (Pydantic)
   └── db/repositories/stories.py   Persistence: queries and writes, no HTTP knowledge
          └── db/models.py          Tables (SQLAlchemy)
```

The waitlist endpoint is simpler and keeps its schemas and database write inside `api/waitlist.py`.

### 5.6 Logging — `app/utils/logging.py`

structlog, routed through the standard library logger with a single stdout handler. Human-readable console output in development; one JSON object per line when `APP_ENV=production`. Uvicorn and Gunicorn logs are redirected into the same handler. Every logger is bound with `service="saransh-api"`. Events use dotted names: `app.startup`, `story.ingested`, `story.ingest_failed`, `waitlist.signup_failed`, `db.tables_ensured`, `db.init_failed`.

---

## 6. Data: what is stored and where

All persistent data lives in one PostgreSQL database. Tables are defined in `app/db/models.py`.

### 6.1 Tables

**`stories`** — one row per news story.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, generated in Python |
| `title_en`, `title_hi` | Text | Required. English and Hindi headline |
| `summary_en`, `summary_hi` | Text | Required. English and Hindi summary |
| `image_url` | Text | Required. Cover image for the story. Any URL is accepted |
| `source_url` | Text | Optional. The one article the summary was written from. Null on stories ingested before it existed |
| `category` | String(50) | Required. Free text, no fixed list |
| `state`, `district` | String(100) | Optional. Geography (Indian state / district). `district` is obsolete after the 8 Oct pivot (14.3) but is still accepted, stored, filtered and returned |
| `status` | String(20) | Required. Default `published`. Ingest always writes `published`; no code writes any other value |
| `created_at` | Timestamp (tz) | Set by the database |
| `updated_at` | Timestamp (tz) | Set by the database, refreshed on update |

**`sources`** — the outlets and links behind a story. Many per story.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `story_id` | UUID | Foreign key → `stories.id`, cascade delete, indexed |
| `outlet` | String(150) | Required. Name of the outlet |
| `url` | Text | Required |
| `source_type` | String(30) | Optional. Free text |
| `created_at` | Timestamp (tz) | Set by the database |

Unique constraint `uq_story_source_url` on (`story_id`, `url`): the same URL cannot appear twice within one story. It does **not** stop the same URL appearing under two different stories.

**`waitlist`** — one row per signup.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer | Primary key, auto-increment |
| `name` | Text | Required |
| `email` | Text | Required, **unique** |
| `created_at` | Timestamp (tz) | Set by the database |

Important naming rule from `CONTEXT.md`: **`state` means geography**. The draft/published lifecycle is always called **status**.

### 6.2 Connection handling — `app/db/database.py`, `app/db/config.py`

- `get_database_url()` rewrites the hostname `postgres` to `localhost` when the code is running outside Docker and `postgres` does not resolve. This lets the same `.env` work in both places.
- `_normalize_driver()` turns `postgresql://` into `postgresql+psycopg2://` (falling back to psycopg v3 if psycopg2 is missing).
- One engine with `pool_pre_ping=True`; `SessionLocal` session factory; `get_db()` is the FastAPI dependency that opens a session per request and closes it afterwards.

### 6.3 How tables get created

There are two mechanisms in the code, and they overlap:

1. **`create_all()` at startup** (`app/db/bootstrap.py`). Every time the API starts, it creates any missing tables. It never alters existing ones. Failures are logged as a warning and the app continues. Disable with `SKIP_DB_AUTO_CREATE=1`. `scripts/init_db.py` does the same thing by hand.
2. **Alembic migrations** (`alembic/`). `alembic/env.py` reads the same `DATABASE_URL` as the app. Revisions, in order:

| Revision | What it does |
|---|---|
| `000000000000` | Baseline. Empty: marks "the schema as it existed" without creating anything |
| `92bc25c70312` | Drops `waitlist.language` and `waitlist.source` |
| `a1b2c3d4e5f6` | Drops `stories.image_url`, `stories.event_at`, `sources.published_at`, `sources.fetched_at` |
| `b2c3d4e5f6a7` | Adds `stories.image_url` back, as a required column |
| `c3d4e5f6a7b8` | Sets every `draft` story to `published` (cannot be undone) |
| `d430a2a6cabe` | "add story tags". Empty: changes nothing |
| `9318b51c9656` | "describe the change". Empty: changes nothing |
| `e4f5a6b7c8d9` | Adds `stories.source_url` |
| `f6a7b8c9d0e1` | Drops `stories.published_at` |

Saransh records its place in this history in its own table, `alembic_version_saransh`, because the production database also holds Rajniti's migration history.

Caveat: the baseline creates no tables and the next two revisions only drop columns that existed in an older schema. So on a brand-new empty database, `alembic upgrade head` creates nothing and then fails trying to drop columns that were never there. The working path for a fresh database is to let `create_all()` build the current tables and then mark the database as up to date with `alembic stamp head`. For a database that already has tables but was never stamped, `docs/DEPLOYMENT.md` describes how to find the newest revision already applied, stamp that, then upgrade. The deploy script runs `alembic upgrade head` itself, so do this once per new database before the first `make deploy`.

Production note: `docs/DEPLOYMENT.md` records that the Supabase database was adopted this way on 2026-10-01.

### 6.4 Data that is not in the database

| Data | Where it lives |
|---|---|
| Sample stories for the landing page preview | Hardcoded in `frontend/src/constants/stories.ts` |
| Contributor list | `frontend/src/data/contributors.json`, regenerated weekly by a GitHub Action |
| Theme preference (light/dark/system) | The visitor's browser `localStorage`, key `saransh-theme` |

---

## 7. How news gets in (ingestion)

**The short version: this repository does not fetch or write news. It only receives finished stories, and it publishes them as they arrive.**

The planned design is a pipeline that reads approved sources and turns them into summarised, reviewed stories (14.5). None of that is built. `app/agents/` contains only an empty `__init__.py`, and a test (`tests/test_api_surface.py`) asserts the API exposes no scraper or agent routes.

What fills the gap today is a **stopgap**: `docs/story-ingest-routine.md` holds a prompt for a scheduled Claude Code routine. Run five times a day, it searches for Indian news, opens the articles, writes the English and Hindi summaries, picks a cover image, and sends up to 10 stories per run to the ingest API. The founder decided on 8 Oct 2026 to keep it until the planned pipeline exists. It does not follow the product rules (see section 11, items 21–24). The repository cannot tell you whether the routine is currently scheduled.

The receiving end, as built:

```
Some outside program (today: the Claude Code routine)
        │   POST /api/v1/stories
        │   Header: X-API-Key: <SARANSH_INGEST_API_KEY>
        │   Body: bilingual title + summary, image_url, category, geography, ≥1 source
        ▼
require_api_key          → 401 if the key is missing or wrong
        ▼
StoryIn validation       → 422 if a field is blank, sources empty, or a URL invalid
        ▼
stories_repo.create_story
        │   1. insert Story with status = "published"
        │   2. flush to obtain the story id
        │   3. insert one Source row per source
        │   4. commit   (any failure → rollback → 500)
        ▼
201 + the saved story
```

Properties of ingest as built:

- **Always published.** The caller cannot set the status, and there is no draft stage. A story is public as soon as it is saved, through `GET /stories`, `GET /stories/{id}` and the landing-page preview (within 60 seconds, the preview's cache time).
- **No review.** No person or agent checks a story between ingest and publication.
- **All or nothing.** The story and its sources are saved in one transaction.
- **Not idempotent.** Sending the same story twice creates two stories. The routine works around this by reading recent stories first.
- **No word limit and no image check.** Any length of summary and any image URL are accepted.
- **No way to unpublish.** No endpoint changes `status`. Removing a story today means editing the database directly.

Try it locally:

```bash
curl -X POST http://localhost:8001/api/v1/stories \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SARANSH_INGEST_API_KEY" \
  -d '{
    "title_en": "Example headline", "title_hi": "उदाहरण शीर्षक",
    "summary_en": "Example summary.", "summary_hi": "उदाहरण सारांश।",
    "image_url": "https://example.com/cover.jpg",
    "category": "National",
    "sources": [{"outlet": "PIB", "url": "https://pib.gov.in/example"}]
  }'
```

---

## 8. Frontend

### 8.1 Shape

A Next.js 14 App Router project in `frontend/`. There are **two routes**: `/` (the landing page) and `/privacy` (the privacy page, linked from the footer). There are no API routes and no `public/` directory. Path alias: `@/` → `frontend/src/`.

### 8.2 Page structure

`src/app/page.tsx` stacks these components top to bottom:

```
Navbar
main
 ├── HeroSection        headline (left) + waitlist form (right)
 ├── WhatSection        story preview carousel (left) + three feature points (right)
 ├── RajnitiSection     explanation (left) + mock "linked representative" chip (right)
 └── BottomCTA          closing line + button that scrolls back to the form
Footer
```

`src/app/layout.tsx` wraps every page: loads fonts, sets SEO metadata, injects the theme script and JSON-LD, and wraps children in the theme provider.

### 8.3 Components

"Client" means it runs in the browser (`"use client"`); "Server" means it renders on the server.

| Component | File | Type | Role |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Server | Sticky top bar: "Saransh सारांश" wordmark, GitHub link, theme toggle (`ThemeSwitch`). No waitlist button. |
| `Footer` | `components/layout/Footer.tsx` | Server | Wordmark, Hindi tagline (the old "आपके ज़िले की खबर…" line; replace per 14.1), Privacy link, link to the repo. |
| `HeroSection` | `components/marketing/HeroSection.tsx` | Client | Two-column hero. Owns the `submitted` state; shows `ThankYou` after a successful signup. |
| `HeroContent` | `components/marketing/HeroContent.tsx` | (rendered inside client) | The headline and lede paragraph. Text only. |
| `WaitlistForm` | `components/waitlist/WaitlistForm.tsx` | Client | Name + email form. Validates, posts to the API, reports success upward via `onSuccess`. Carries `id="waitlist"`. |
| `ThankYou` | `components/waitlist/ThankYou.tsx` | Client | Full-screen confirmation overlay. Locks page scroll. Links to GitHub and Rajniti. No close button. |
| `WhatSection` | `components/marketing/WhatSection.tsx` | Server | Carousel plus three points: Verified sources, Open-source pipeline, Human reviewed. Icons are inline SVGs. |
| `StoryCarousel` | `components/stories/StoryCarousel.tsx` | Server (async) | Fetches up to 3 published stories; falls back to the sample stories if none. |
| `StoryCarouselClient` | `components/stories/StoryCarouselClient.tsx` | Client | Shows one card at a time under the label "LIVE FEED PREVIEW", with a position counter. Moves only when asked: outlined Back and filled Next circles, and swipe on touch (80px threshold). No auto-advance. |
| `StoryCard` | `components/stories/StoryCard.tsx` | (rendered inside client) | The app story card from design system v1.2: image (the story's `image_url`, or a topic-coloured wash when there is none) with a credit chip, headline, body, a time line in the topic colour, the source line, and an outlined "Read story" link to the source article. No topic label yet (14.6). |
| `RajnitiSection` | `components/marketing/RajnitiSection.tsx` | Server | Explains the Rajniti link. The "MLA · Barabanki Sadar" chip is static illustration, not data. |
| `BottomCTA` | `components/marketing/BottomCTA.tsx` | Client | "Join the waitlist" button that smooth-scrolls to the top of the page. |
| `ThemeProvider` | `components/providers/ThemeProvider.tsx` | Client | Thin wrapper around Sutra's theme provider. |
| `ThemeSwitch` | `components/layout/ThemeSwitch.tsx` | Client | Mounts Sutra's `ThemeToggle` on the client only, with a same-sized placeholder during server render, so the toggle cannot break hydration. |
| Privacy page | `app/privacy/page.tsx` | Server | What is collected on the waitlist and how analytics would work. |
| `JsonLd` | `components/seo/JsonLd.tsx` | Server | Renders structured-data `<script>` tags. |

### 8.4 Supporting code (`src/lib/`)

| File | Role |
|---|---|
| `api-base.ts` | `getApiBaseUrl()` — decides which URL to call the backend on. See 8.5. |
| `stories.ts` | `fetchPublishedStories(limit)`, `mapApiStoryToCarousel()` and `topicFor()` — fetches from the API, converts an API story into the card shape, and picks a topic from keywords in the free-text category. Returns `[]` on any error. |
| `validate.ts` | `validateName()` and `validateEmail()` for the waitlist form. |
| `logger.ts` | pino logger named `saransh-web`; works on server and in the browser. |
| `routes.ts` | `ROUTES` (internal paths) and `EXTERNAL` (repo, issues, Rajniti, Sutra links). |
| `seo/site.ts` | Site name, tagline, description, `getSiteUrl()`, default Open Graph and Twitter metadata. |
| `seo/images.ts` | Open Graph image URL helpers. |
| `seo/json-ld.ts` | Builders for WebSite, NewsMediaOrganization and Breadcrumb structured data. |

### 8.5 How the frontend reaches the backend

`next.config.mjs` defines one rewrite: any request to the frontend at `/api/v1/*` is forwarded to the backend. The backend origin is resolved from `API_REWRITE_TARGET`, then `API_URL`, then `NEXT_PUBLIC_API_URL`, then `http://127.0.0.1:8001`.

`getApiBaseUrl()` then picks the base URL for each situation:

| Where the code runs | `NEXT_PUBLIC_API_URL` is… | Base URL used | Why |
|---|---|---|---|
| Browser | localhost | That URL directly (e.g. `http://localhost:8001/api/v1`) | Simple local dev; relies on backend CORS |
| Browser | a remote host (production) | `/api/v1` on the frontend's own origin | Goes through the Next.js rewrite, so it is same-origin and does not depend on CORS |
| Server (SSR) | localhost | `http://HOST:PORT/api/v1` on the Next server itself (default `127.0.0.1:3001`) | Loops through the rewrite, which works inside Docker where `localhost:8001` does not |
| Server (SSR) | a remote host | `API_URL` / `INTERNAL_API_URL` if set, else the public URL | Direct call |

### 8.6 Waitlist flow, end to end

```
User types name + email, presses JOIN THE WAITLIST
   ▼
validateName / validateEmail (browser)      → inline error, no request sent
   ▼
POST {base}/waitlist   { name, email }  (both trimmed)
   ▼
Backend: validate → lowercase email → insert
   ▼
201 {ok:true}   or   200 {ok:true, duplicate:true}
   ▼
WaitlistForm calls onSuccess()  →  HeroSection sets submitted = true
   ▼
ThankYou overlay covers the page
```

Both a new signup and a repeat signup look identical to the user. Any failure shows "Something went wrong. Please try again."

The browser's name check is stricter than the server's. It rejects names shorter than 2 characters, a single repeated character, all-caps strings with no vowels, any character repeated three or more times in a row, and names with fewer than 2 distinct characters. The server only requires 2 non-blank characters.

### 8.7 Story preview flow

```
WhatSection renders (server)
   ▼
StoryCarousel → fetchPublishedStories(3)
   ▼
GET {server base}/stories?status=published&limit=3     (Next caches for 60 seconds)
   ▼
≥1 story  → map each to a card:
              time      = hours since created_at ("3 hrs ago", minimum 1)
              headline  = title_en,  body = summary_en
              image     = image_url, loaded straight from wherever it points
              credit    = first source's outlet name
              source    = "<first outlet> · Verified"
              link      = source_url, else the first source's URL
              topic     = guessed from keywords in category
                          (edu / health / jobs / transport, else civic)
0 stories or any error → use the 3 hardcoded samples in constants/stories.ts
   ▼
StoryCarouselClient shows one card with Back and Next
```

Only English fields are used. The Hindi title and summary are stored but not displayed anywhere yet. The card's `category` text is built (`category · state · district`) but not shown on the card. The official-source tick appears only on the hardcoded samples; stories from the API never carry it.

### 8.8 SEO and metadata

Set in `layout.tsx`: title template `%s | Saransh`, description, Open Graph and Twitter card defaults, `robots: index, follow`, and two JSON-LD blocks (WebSite and NewsMediaOrganization). The canonical site URL comes from `getSiteUrl()`: `NEXT_PUBLIC_SITE_URL` → `NEXTAUTH_URL` → `VERCEL_URL` → `http://localhost:3001`.

`vercel.json` adds `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict referrer policy, and long-lived caching for `/_next/static/*`.

### 8.9 Frontend environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL including `/api/v1`. The only one needed in production. |
| `API_REWRITE_TARGET` | Backend origin for the rewrite (set to `http://saransh-api:8001` in Docker). |
| `API_URL` / `INTERNAL_API_URL` | Optional server-side backend URL. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO. Leave unset on Vercel. |
| `NEXT_PUBLIC_LOG_LEVEL` | pino level. Default `debug` locally, `info` in production. |
| `NEXTAUTH_*`, `GOOGLE_CLIENT_*` | Google sign-in. No code reads them yet, but they are no longer parity placeholders: the OAuth client is provisioned per `docs/google-oauth-setup.md` and the sign-in slices will consume these exact names. `NEXTAUTH_URL` must be the production origin on Vercel, not left to `VERCEL_URL`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Placeholder copied from Rajniti. Nothing reads it; analytics is PostHog ([ADR 0004](adr/0004-posthog-for-saransh-analytics.md)). |

---

## 9. Sutra UI and theming

### 9.1 What Sutra is

Sutra (`github.com/imsks/sutra-ui`) is the open-source design system shared between Saransh and Rajniti. It is consumed as two published npm packages, both at version `0.0.1`:

- **`@sutra_ui/tokens`** — design tokens as CSS variables (`--sutra-*`).
- **`@sutra_ui/ui`** — React components built on those tokens with Tailwind classes.

### 9.2 Where it is actually used today

Sutra is wired in fully but used lightly. Exactly three touchpoints:

| Where | What |
|---|---|
| `src/app/globals.css` | Imports `@sutra_ui/tokens/css`; adds Sutra's `dist` folder as a Tailwind scan source so the classes inside Sutra components get generated; overrides the `--sutra-*` variables with Saransh's palette; maps them to Tailwind colour names. |
| `src/components/providers/ThemeProvider.tsx` | Sutra's `ThemeProvider`, with `defaultTheme="system"` and `storageKey="saransh-theme"`. |
| `src/components/layout/ThemeSwitch.tsx` (used by `Navbar`) | Sutra's `ThemeToggle` button, mounted on the client only. |

Everything else on the page (the form inputs, buttons, cards, the overlay, the spinner) is hand-written HTML with Tailwind classes, not Sutra components.

Sutra exports more that is available but unused: `Button`, `Card`, `Input`, `Field`, `Select`, `Textarea`, `Badge`, `Avatar`, `Link`, `Modal`, `Skeleton`, `Spinner`, `Text`, `Toast` / `ToastProvider` / `useToast`, `useTheme`, plus the `cn` and `tv` helpers. Because the tokens are already re-skinned, any of these will pick up the Saransh look as soon as they are used.

House rule (README): a component generic enough for Rajniti to want belongs in Sutra, not in this repo.

### 9.3 How theming works

There is no `tailwind.config` file. Tailwind v4 is configured entirely in `globals.css`.

1. **Tokens.** `:root` defines the light palette as CSS variables. `.dark` redefines them.
2. **Tailwind mapping.** The `@theme inline` block turns each variable into a Tailwind colour, so `bg-paper`, `text-ink`, `border-line`, `text-red` and so on all follow the active theme automatically. Components use these names and rarely need a `dark:` prefix; the few that have one (the waitlist form, the outlined button) use it where a token alone cannot express the difference.
3. **Dark variant.** `@custom-variant dark (&:where(.dark, .dark *))` ties Tailwind's `dark:` to the `.dark` class rather than the OS setting.
4. **Switching.** Sutra's `ThemeProvider` adds or removes `.dark` on `<html>` and saves the choice in `localStorage` under `saransh-theme`.
5. **No flash.** An inline script in `layout.tsx` runs before the first paint, reads the same key (or the OS preference if the choice is "system" or unset), and sets `.dark` immediately.

### 9.4 Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `--paper` | `#eeedea` | `#191816` | Page background |
| `--card` | `#ffffff` | `#211f1c` | Cards, form surface |
| `--ink` | `#0f1419` | `#e6e4df` | Primary text, strong borders, primary buttons |
| `--muted` | `#6b6862` | `#8e8a82` | Secondary text, labels |
| `--line` | `#e2e0d8` | `#2c2a25` | Dividers |
| `--line-heavy` | `#c0bdb4` | `#3a3730` | Input borders, disabled |
| `--red` | `#c41e2e` | `#d95550` | Accent: emphasis, hover, errors, source chips |
| `--red-tint` | `#fdf0f1` | `#2e1618` | Red wash background |
| `--blue` | `#1a4f8a` | `#5a8ebe` | Rajniti / civic accent |
| `--blue-tint` | `#edf2f8` | `#141e2a` | Blue wash background |
| `--green` | `#1f6b3e` | `#4a9b6a` | Success |
| `--green-tint` | `#eaf3ed` | `#152518` | Success wash background |
| `--amber` | `#b8691a` | `#d4944a` | Warning / "delayed" |
| `--amber-tint` | `#fbf1e6` | `#352310` | Amber wash background |

`--background` / `--foreground` (used on `<body>`) are aliases: `--background: var(--paper)` and `--foreground: var(--ink)`, declared once in `:root` and not redeclared in `.dark`. The retired cold dark value `#111417` is gone, and `globals.test.ts` guards against it coming back.

**App tokens (design system v1.2) are in the code** and mapped to Tailwind names:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--body` | `#2d3139` | `#c9c6bf` | Story body text |
| `--edge` | `#e2e0d8` | `#3a3730` | 1px card border |
| `--tint` | `#e8e6e0` | `#2a2824` | Done / guest-end card background |
| `--img-bg` | `#dad7cf` | `#2a2824` | Placeholder behind a photo |
| `--on-red` | `#ffffff` | `#191816` | Text on a red fill |
| `--scrim` | `rgba(15,20,25,.58)` | `rgba(0,0,0,.6)` | Photo-credit chip |
| `--cta-shadow` | `#0f1419` | `#8e8a82` | Hard shadow on "Read story" |
| `--card-shadow` | `0 10px 28px rgba(15,20,25,.1)` | `none` | App story card |

**Topic tokens in the code are the retired v1.2 set**: `--topic-civic`, `--topic-edu`, `--topic-health`, `--topic-jobs`, `--topic-transport`, each with a `-bg` wash (in dark mode the wash is the accent mixed 18% into the card colour). Design system v1.3 replaces them with seven: `politics`, `civic`, `education`, `crime`, `business`, `entertainment`, `sports` (see 14.6). Not yet in code.


### 9.5 Typography

Loaded through `next/font/google` in `layout.tsx` and exposed as CSS variables:

| Tailwind class | Font | Used for |
|---|---|---|
| `font-serif` | Fraunces | Headings, wordmark, story headlines |
| `font-sans` | Inter | Body text |
| `font-mono` | IBM Plex Mono | Labels, eyebrows, buttons, metadata |
| `font-hindi` | Noto Sans Devanagari | Hindi text |

Inter is loaded in weights 400–800; 700 and 800 are there only for the preview story card. Noto Sans Devanagari is loaded in 400 and 500.

The landing page keeps these fonts. The reader app will use **DM Sans** (English) + Noto Sans Devanagari (Hindi), decided 8 Oct 2026 (14.6); DM Sans is not loaded yet, so the preview card is set in Inter.

Three small animations are defined in `globals.css`: `animate-card-in`, `animate-fade-in`, `animate-pop-in`. All animation is effectively switched off for users who prefer reduced motion.

---

## 10. Running, testing, deploying

### 10.1 Local development

```bash
make setup    # copies .env.example → .env and frontend/.env.example → frontend/.env
make up       # builds and starts everything in Docker
make stop     # stops it
```

| Service | Container | URL / port | Notes |
|---|---|---|---|
| Postgres 16 | `saransh-postgres` | `127.0.0.1:5433` | User, password and database are all `rajniti` by default (a leftover name; it is Saransh's own instance). Data persists in the `postgres_data` volume. |
| API | `saransh-api` | `http://localhost:8001` | `development` Docker target, Uvicorn with `--reload`, source mounted for hot reload. `DATABASE_URL` is forced to the Compose Postgres. |
| Frontend | `saransh-web` | `http://localhost:3001` | `next dev`, source mounted. Dependencies are installed at image build time and re-synced only when `package-lock.json` changes. |

API docs: `http://localhost:8001/docs`. Reset the database: `docker compose down -v && make up`.

Without Docker: see the "Quick Start — Local" section of `readme.md`.

### 10.2 Tests

**Backend** (`tests/`, pytest): 111 test functions.

| File | Tests | Covers |
|---|---|---|
| `test_stories.py` | 49 | Ingest success and validation, API key auth, list filters and pagination, detail, 404, unversioned path not served |
| `test_waitlist.py` | 5 | 201, duplicate 200, short name, bad email, legacy fields ignored |
| `test_config.py` | 10 | CORS origin parsing |
| `test_cors.py` | 5 | Preflight behaviour; `main.py` uses the configured origins |
| `test_alembic.py` | 5 | Migration setup |
| `test_logging.py` | 3 | Logger setup |
| `test_api_surface.py` | 1 | Health and waitlist routes exist; no scraper/agent routes |
| `test_dockerfile.py`, `test_docker_compose.py`, `test_frontend_docker.py`, `test_makefile.py`, `test_next_rewrites.py` | 33 | "Contract" tests that read the config files as text and assert on their shape (e.g. deploy script never tags `latest`, Dockerfile builds without BuildKit) |

How the test harness works (`tests/conftest.py`): tests run against **in-memory SQLite**, not Postgres. The Postgres `UUID` column type is patched to behave as `CHAR(36)` on SQLite. A minimal FastAPI app is built with only the stories and waitlist routers. Each test runs inside a transaction that is rolled back afterwards, so tests do not affect each other.

**Frontend** (`frontend/src/**/*.test.ts(x)`, Vitest): 68 tests in 12 files. Library functions (`api-base`, `validate`, `stories`, `logger`, `getSiteUrl`), the tokens in `globals.css`, and component tests for `StoryCard`, `StoryCarouselClient`, `WaitlistForm`, `ThemeSwitch`, `Footer` and the privacy page. There are no browser (end-to-end) tests.

```bash
pytest tests/ -q                 # backend
cd frontend && npm test          # frontend
```

### 10.3 Continuous integration (`.github/workflows/`)

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push / PR to `master`, `production`, `development` | Backend tests; frontend tests; backend lint (black, isort, flake8; mypy is advisory); frontend lint + typecheck; frontend production build |
| `react-doctor.yml` | PRs and pushes | Advisory React code-health scan of `frontend/`; comments on PRs, never fails |
| `release.yml` | PR merged into `production`, or manual | Bumps the version (from PR labels `major`/`minor`, else patch) in `pyproject.toml` and `frontend/package.json`, tags, creates a GitHub Release |
| `update_contributors.yml` | Weekly (Monday 00:00 UTC), or manual | Regenerates `frontend/src/data/contributors.json` and commits it |

Pre-commit hooks (`.pre-commit-config.yaml`): black, isort, whitespace fixes for Python, and React Doctor on staged frontend files.

### 10.4 Deployment

Full reference: `docs/DEPLOYMENT.md`.

- **API → Google Cloud Run**, via `make deploy` (`scripts/deploy_cloud_run.sh`). A person runs it; there is no CI deploy. The script requires `GCP_PROJECT_ID`, `DATABASE_URL`, `SARANSH_INGEST_API_KEY` and `CORS_ORIGINS`, refuses to run from a dirty git tree, builds the `production` Docker target for `linux/amd64`, tags the image with the commit SHA (never `latest`), pushes to Artifact Registry, runs `alembic upgrade head` against `DATABASE_URL` (skipped with `SKIP_MIGRATIONS=1`), and then deploys. Defaults: region `asia-south1`, service `saransh-api`, 0–4 instances.
- **Production container:** Gunicorn with one Uvicorn worker, bound to the `PORT` that Cloud Run injects (8080).
- **Frontend → Vercel**, from the `frontend/` directory. Only `NEXT_PUBLIC_API_URL` needs to be set there.
- **Database → Supabase** (hosted Postgres, shared with Rajniti). Connect through the session-mode pooler on port 5432, not the IPv6-only direct host.
- **Secrets** are plain Cloud Run environment variables (an accepted trade-off, documented in `DEPLOYMENT.md`).

The code references a production frontend origin (`https://saransh-app.vercel.app`, in `app/config.py`) and a Cloud Run URL (in a frontend test). The frontend at `https://saransh-app.vercel.app` was confirmed live on 2026-10-02 (landing page with the waitlist form). Whether the Cloud Run API is live is not something the repository can tell you.

---

## 11. Known gaps and things that will surprise you

These are observations from reading the code, listed so nobody builds on a wrong assumption. Some carry a "spec" number from an earlier plan; those spec files are not in the repository (item 34).

**Product claims the code does not yet back**

1. **No ingestion pipeline.** The landing page describes verified-source ingestion and an open-source pipeline. No scraper, summariser or agent exists in this repo.
2. **No human review step.** The landing page says every story is reviewed before going live. There is no review UI and no publish action, and ingest publishes directly.
3. **The "Live feed preview" shows whatever was ingested last.** It shows the three newest published stories, which today come from the stopgap routine, unreviewed. When the API returns none it shows three hardcoded samples under the same "Live feed preview" label.
4. **The Rajniti link is a mock-up.** No code talks to Rajniti.

**Backend**

5. **There is no draft stage.** Ingest writes `published`, a migration promoted the old drafts, and `published_at` was dropped. The `status` column and filter remain, but only one value is ever written.
6. **Ingest is not idempotent.** Retrying a POST creates a duplicate story. (Spec 04.)
7. **The waitlist has no abuse protection.** No rate limit, no honeypot. (Spec 06.)
8. **CORS allows `PATCH`, but no `PATCH` endpoint exists.** It is reserved for a future publish action.
9. **`DATABASE_URL` still defaults to a database named `rajniti`**, and the local Postgres user/password/database are also `rajniti`. In production the database really is shared with Rajniti (ADR 0006), so the name is no longer wrong there; locally it is Saransh's own empty instance. A missing `DATABASE_URL` should fail loudly instead of falling back to a default.
10. **Startup still runs `create_all()`** even in production unless `SKIP_DB_AUTO_CREATE` is set, alongside Alembic. See the fresh-database caveat in section 6.3.
11. **`/health` does not check the database.** It returns "healthy" unconditionally, so a service with an unreachable database still reports healthy. (Spec 03.)
12. **`category` and `source_type` are free text.** Nothing enforces a fixed list, so filters only match exact strings.

**Frontend**

13. **Server error messages never reach the user.** The form reads `payload.message`, but FastAPI returns errors under `detail`. The user always sees the generic message. Harmless today, worth knowing before adding specific errors.
14. **The Open Graph image URL points at `/opengraph-image`, which does not exist.** There is no `app/opengraph-image.tsx`, so link previews will have no image. `routes.ts` also mentions an `app/sitemap.ts` that does not exist.
15. **Unused code and assets:** `contributors.json` is generated weekly but not displayed anywhere; `buildBreadcrumbJsonLd` and most `EXTERNAL` links are unused; the Geist font files in `src/app/fonts/` are unused.
16. **Hindi content is stored but not shown.** The preview uses `title_en` and `summary_en` only.
17. **The ThankYou overlay cannot be dismissed** short of reloading the page.

**Docs and tooling**

18. **A Google Analytics placeholder is still in the environment template.** `frontend/.env.example` carries `NEXT_PUBLIC_GA_MEASUREMENT_ID`. ADR 0004 chose PostHog and said to delete this key; nothing reads it.
19. **`CONTEXT.md` and `.github/agents/*.md` define terms for things that are not built yet** (Tier, Edition, Review, the Pipeline and its Agents). They were rewritten on 8 Oct 2026 for the national-news plan and mark planned items as planned. Treat them as vocabulary and rules, and this file as the description of the code.
20. **`requirements-test.txt` and `conftest.py` carry leftovers** from an earlier AI-pipeline version of the project (e.g. an `OPENAI_API_KEY` test default) that nothing uses.

**Added 2026-10-08 (mismatches with the current product decisions)**

The first four come from the stopgap ingest routine. The founder has decided to keep the routine until the planned pipeline exists (14.9), so these are known and accepted for now, not oversights.

21. **Stories are published without a person approving them.** The product rule is that a person approves every story before it is published.
22. **Publisher images are loaded directly.** The routine is told to use the outlet's article lead image, and the card loads that URL as it is. The product rule is official photos or Saransh illustrations only, never a publisher's image.
23. **The routine opens and reads article pages.** The product rule is RSS, licensed feeds and official sources only.
24. **The routine is not local AI.** The cost rule is ₹0 with local models (Ollama).
25. **No word-count check on ingest.** The product rule is English ≤ 60 words and Hindi ≤ 70 words, hard reject. Only blank-field and URL checks exist.
26. **Every API story is labelled "· Verified"** next to the outlet name. The design rule is a plain outlet name, with the green tick for official sources only.
27. **District is still everywhere.** The API accepts, stores, filters and returns `district`; two of the three sample stories are Barabanki stories; the Rajniti mock-up shows "MLA · Barabanki Sadar". The product no longer has a district tier.
28. **The landing page uses the old positioning.** "आपके ज़िले की खबर…" in the footer and on the thank-you screen; "India's Hyperlocal News Digest" in the page title; the old headline in the hero and in `SITE_TAGLINE`.
29. **One sample story carries an official tick for PTI.** PTI is a news agency, not an official source.
30. **Topic set and card are design system v1.2.** Five retired topics in `globals.css`, `constants/stories.ts` and `lib/stories.ts`; topic colour on the time line; no topic label.
31. **The privacy page describes analytics that do not exist.** It describes PostHog usage analytics and session recordings. No analytics code is in the repository. Decided 8 Oct 2026: build the analytics to match the page.
32. **The live stopgap routine may be running an older prompt.** `docs/story-ingest-routine.md` was updated on 8 Oct 2026 (no "Regional" tier, no district, word limits stated), but a routine only changes when its scheduled prompt is replaced. Until then it may still send `district` and "Regional" stories.
33. **The ADRs are records of their date.** ADR 0001's context mentions scraping and embeddings, ADR 0005 refers to the superseded ADR 0003, and ADR 0006 lists "district" as a reader preference. ADR 0005 and ADR 0006 carry a dated note pointing to the current position; the original text is left as written.
34. **`docs/specs/launch-readiness/` does not exist.** The "spec" numbers in this section name planned items, not files.
35. **`docs/design-audit.md` and `docs/design-audit-pr.md` are untracked**, and the `.gitignore` lines that would hide them (and this file) are commented out in an uncommitted change. This file itself is tracked as of commit `771bbac`.

**Fixed since the 2 Oct version of this file:** dark `--background` no longer holds the cold `#111417` (it aliases `--paper`); `--amber-tint` is defined in both themes and mapped to a Tailwind colour; `image_url` is back on stories.

---

## 12. How to build on top of this

Conventions to follow, drawn from the existing code.

**Vocabulary.** Use the terms in `CONTEXT.md`: Story, Source, Summary, Citation Link, Ingest, Publication Status, Tier, State, Topic, Edition, Review, Waitlist Signup, User. Never use "state" for the draft/published lifecycle, and never call an edition a session.

**Adding a backend endpoint**

1. Add or extend Pydantic schemas in `app/schemas/`.
2. Put queries and writes in `app/db/repositories/` (no HTTP concerns there).
3. Add the route in `app/api/<feature>.py`, exporting `router`.
4. Register the router in `app/api/__init__.py`. It is then served under `/api/v1`.
5. Protect write endpoints with `dependencies=[Depends(require_api_key)]`.
6. Log with `get_logger(__name__)` and a dotted event name.
7. If a new router needs tests, load it in `tests/conftest.py` the same way stories and waitlist are loaded.

**Changing the database**

1. Edit `app/db/models.py` (explicit `Column(...)` style; reuse `CreatedAtMixin`).
2. Create a migration: `make revision m="…"`, using `op.batch_alter_table` as the existing revisions do. Read the generated file before committing: it must touch only Saransh-owned tables, never `users` or any other Rajniti table (ADR 0006). Fix the empty baseline (spec 03) and restrict autogenerate to Saransh-owned tables before adding new revisions.
3. Apply it to each environment before deploying code that needs it.
4. Update the matching Pydantic schema and the tables in section 6 of this document.

**Adding a frontend section or page**

1. Create the component under `src/components/<area>/` and export it from that folder's `index.ts`.
2. Keep it a server component unless it needs state, effects or event handlers; only then add `"use client"`.
3. Style with the theme colour names (`bg-paper`, `text-ink`, `border-line`, …) so dark mode works with no extra effort. Avoid hardcoded hex colours.
4. Reach for a Sutra component first (`Button`, `Input`, `Card`, `Modal`, `Toast`, …) before hand-writing one.
5. Call the backend through `getApiBaseUrl()`; never hardcode a host.
6. Add new paths to `ROUTES` and new external links to `EXTERNAL` in `src/lib/routes.ts`.
7. Put pure logic in `src/lib/` with a `.test.ts` beside it.

**Layout conventions already in use:** content width `max-w-[1120px]`, horizontal padding `px-8` (`px-5` below 560px), two-column layouts switch on at 860px, sections are separated by `border-t border-line`.

**Before opening a PR:** `pytest tests/ -q`; `black`, `isort`, `flake8` over `app tests scripts`; and in `frontend/`: `npm test`, `npm run lint`, `npm run typecheck`.

---

## 13. Keeping this document current

Update this file in the same pull request as the change it describes.

| If you… | Update |
|---|---|
| Add, change or remove an endpoint | 5.3, and 2 if it changes what is "built" |
| Change a table or add a migration | 6.1, 6.3 |
| Change how stories get in or get published | 7, 2 |
| Add a page, section or component | 8.2, 8.3 |
| Start using a new Sutra component, or change the palette | 9.2, 9.4 |
| Change env vars, Docker, CI or deploy | 5.2, 8.9, 10 |
| Fix something listed in section 11 | Remove it from 11 |
| Notice a new mismatch between docs and code | Add it to 11 |
| Change a product rule or a term | 14, `CONTEXT.md`, and the rules in `CONTRIBUTING.md` and `.github/agents/` |
| Build something listed in section 14 | Move it from 14 into the matching section, and tick it in 14.8 |

Then update the "Last verified" date and commit hash at the top.

---

## 14. Product direction and the gap to close (8 Oct 2026)

**This section is planned work, not code.** It summarises the product decisions so that anyone building next knows what the code must become. The full requirements are in **PRD v1.1** (8 Oct 2026, draft for founder review), which supersedes PRD v1.0 and the earlier GitHub PRD #79; the decisions and their reasons are in the founder's `CLAUDE.md` and design system v1.3. Those documents are kept by the founder outside this repository. If this section and PRD v1.1 disagree, PRD v1.1 wins and this section should be corrected.

### 14.1 What Saransh is now

- An open-source news app for India: no noise, no algorithm. A portfolio project (aimed at AI PM roles), open to community contribution.
- **Positioning line:** "शोर नहीं। सिर्फ़ खबर। सबूत के साथ।" / "No noise. Just news. With proof."
- **Three tiers, mixed in one feed:** National, State (from national sources tagged by state) and International (only when relevant to India). **No district tier.**
- **Topics:** Politics, Civic, Education, Business & Economy, Crime. Entertainment and Sports are "coming soon" (interest only; their stories are excluded).
- **Hindi and English are equal.** The reader picks one at onboarding.
- **No personalisation.** Topics are the reader's choice; nothing is learned from clicks or reading time.
- **Later:** V2 = politician-wise news on Rajniti profiles; V3 = citizen reporting and Jan Awaaz.

### 14.2 Reader experience to build

| Area | Rule |
|---|---|
| Platform | Installable PWA with an offline page. **No card caching.** |
| Sign-in | Google (NextAuth), Saransh's own OAuth client. The backend verifies identity itself (ADR 0005). Users live in the shared `users` table that Rajniti owns (ADR 0006). |
| Guests | **6** National and International cards, **counted toward the 50** (they belong to edition 1), then a sign-in wall. Progress carries over after sign-in (matched by device). |
| Onboarding | Language (required, nothing pre-selected, fallback English) · state (required, searchable) · topics (optional, up to 3). Name prefilled from Google, editable. **No username step and no district question.** Language, state and topics are changed later in Settings. |
| Home | One swipeable card per story (80px threshold, tap and button fallbacks). |
| Daily limit | 50 per reader, in editions of **15 / 15 / 10 / 10**. 4-hour wait counted from the end of an edition. Midnight IST reset. "You're all caught up" card when supply runs out. |
| Feed mix (config) | Daily tier minimums **National 25, State 15, International 10**. Chosen topics ≈ 60% within each tier. Tiers interleaved (never more than twice in a row), newest first within a tier, the same topic never more than three times in a row. Short tiers filled from National and topic stories. |
| Card | Image (official photo or Saransh topic illustration, never a publisher image) → topic label + ⋮ → headline → body → muted time line → source + "Read story" link-out. Green tick only for official sources. |
| Sheets | Share and Report open to guests; Save needs sign-in. Reminder ask on the done screen, not at onboarding. |
| Trust surfaces | Public corrections log. Corrections and grievances are raised as GitHub Issues (`correction` and `grievance` labels, an issue template). In-app "Report an error" opens a prefilled report. Public source registry and prompts. |
| No personalisation | The feed depends only on the reader's chosen language, state and topics; the story's tier, state, topic and time; and how much of the day's 50 is used. Analytics events, `read_events` and session replays never feed ranking, topic suggestions or the tier mix. A test and a code-review rule enforce this. |

### 14.3 Data changes

| Change | Why |
|---|---|
| Add `tier` (`national` / `state` / `international`) | Mix and order are built per tier. `state` alone can't tell National from International. |
| Make `category` a fixed list of 7 topic keys (`politics`, `civic`, `education`, `crime`, `business`, `entertainment`, `sports`), one per story | Topic filters and colours need exact values. Item 12 in section 11. |
| Keep `state` (a fixed list of Indian states / UTs) | Required for State-tier stories; null for National and International. |
| Stop using `district` (leave the column, drop from the API and samples) | District tier removed. Drop the column only in a later cleanup migration. |
| Keep `image_url` (re-added in migration `b2c3d4e5f6a7`), restrict it to Saransh's own or official images, and add an image credit field | Every story has an image, never a publisher's. Today any URL is accepted. |
| Extend `status` to `draft` / `in_review` / `published` / `corrected` / `retracted`, and restore `published_at` | Review and corrections flow. |
| Add review metadata (`pipeline_meta`: model, prompt version, reviewer, agent check results, tag corrections) | Audit trail and the tagging-accuracy metric. |
| Add `corrections` table (public) | Corrections log (IT Rules 2021). |
| Add `saransh_user_preferences` (keyed by `user_id` → `users.id`: language, state, topics, coming-soon interests, onboarding done) and `read_events` (user/device, story, edition, timestamp). Do **not** create or alter `users`: Rajniti owns it (ADR 0006) | Sign-in, onboarding, the 50/day limit and edition tracking. |
| Make `source_type` a fixed list (`rss`, `licensed`, `official`) and add an `official` flag | Source registry and the official-tick rule. |

### 14.4 Backend changes

1. **Bring back the draft stage and published-only reads, together with the publish action (#3).** Ingest saves as `draft` again; `GET /stories` defaults to published; `GET /stories/{id}` returns 404 for anything not published. On its own this would empty the landing preview back to samples, so it ships with the publish action, and the stopgap routine is switched off at the same time (14.9).
2. **Word-limit validator.** English ≤ 60 words, Hindi ≤ 70 words, hard reject (422). One shared counter: a word is anything between spaces; punctuation does not count. Tests in both languages.
3. **Publish action.** `PATCH` to move a story through `status`, set `published_at`, and log who approved it and when (the reserved `PATCH` in CORS).
4. **Fix the Alembic baseline** (spec 03) before any new migration.
5. **Idempotent ingest** (spec 04) and dedupe.
6. **Feed endpoint** that builds an edition for a reader: tier minimums, topic weighting, interleaving, backfill, the daily cap and the 4-hour wait.
7. **Auth:** verify identity on the API as ADR 0005 describes; map a model over the shared `users` table without migrating it; `saransh_user_preferences` and `read_events` endpoints; restrict Alembic autogenerate to Saransh-owned tables.
8. **Ops:** `/health` checks the database; validate `DATABASE_URL` at startup; replace the `rajniti` default with a required value; skip `create_all()` in production; rate-limit the waitlist (spec 06).

### 14.5 Pipeline to build (inside this repo, in `app/agents/` or a separate worker)

```
Approved sources (RSS, licensed feeds, official sources — NO scraping of article pages)
   ▼
Fetch + normalise + dedupe (keep every source URL)
   ▼
Summarise in the source language → translate to the other language   (local Ollama only, ₹0)
   ▼
Tag: tier, state, one topic   (drop International stories with no India link; drop Entertainment/Sports until live)
   ▼
Agent first-pass check: word limits, attribution, summary matches source, Hindi–English differences
   ▼
Human review (team of 3): approve / edit / kill on a side-by-side Hindi + English screen; correct tags
   ▼
Publish with source link-out
```

- **Prompts are open source and versioned.** Fact-only, attributed claims, no opinion adjectives.
- **The source list is the founder's call** [pending]. Each outlet's reuse terms are checked before it enters the registry. PTI and ANI are licensed, not free.
- **Fail per story, not per batch.**
- **Until this exists, the stopgap routine in section 7 stays** (founder's decision, 8 Oct 2026). When the pipeline is ready, the routine is switched off.
- **The machine-translation label** is shown to reviewers only; the public "How we work" page comes later.

### 14.6 Frontend and design changes

- **Landing page:** replace the positioning line (Footer, thank-you screen, hero, page title, SEO tagline); label the preview "Sample story" when it shows samples; replace the district samples and remove the PTI tick; drop "· Verified" from the source line; remove the Barabanki Rajniti chip (Rajniti is V2); soften claims the code can't back yet (section 11, items 1–4).
- **Tokens:** the `--background` / `--foreground` aliases and the v1.2 app tokens are already in code. Still to do: replace the five v1.2 topic tokens with the seven `--topic-*` colours from design system v1.3 §05 (`edu` becomes `education`; `health`, `jobs` and `transport` are removed), update the Tailwind mapping and `globals.test.ts`; remove nothing the landing page still uses.
- **Story card:** add the topic label (12px / 700, topic colour, top-left of the card body); the time line becomes muted.
- **Reader app fonts:** DM Sans + Noto Sans Devanagari, 800-weight sans headlines; Fraunces + Tiro Devanagari Hindi for the wordmark only. The landing page keeps Fraunces + Inter + IBM Plex Mono.
- **Topic colours (light / dark):** Politics `#0b7f8a` / `#86d6dc` · Civic `#2457d6` / `#9db8f7` · Education `#6648d1` / `#bfaef4` · Crime `#7a1f1f` / `#f27474` · Business & Economy `#946f00` / `#f2c94c` · Entertainment `#a21caf` / `#e59bef` · Sports `#4d7c0f` / `#a9d46a`. Used only on the topic label and the illustration pastel.
- **Hindi overflow test** with real 70-word stories before launch; if the card overflows, drop the time line or shrink the image.
- **Coming-soon topic pills** (Entertainment, Sports): solid hairline border, muted label, small "Soon" / "जल्द" tag. Not dashed.
- **Hindi label for Civic is "सिविक"** (decided 8 Oct 2026; design system v1.3 and app mock v4 both use it).
- **"Edition" is the word** for a batch of cards, in the app and in the docs.
- Design system v1.3 (synced to app mock v4) is the source of truth. Use token names, never hex.

### 14.7 Pilot and success numbers

- **Pilot:** 4 weeks, all tiers, real stories, every story approved by a person. Cost ₹0 (local AI only).
- **Production:** 50+ reviewed stories a day on at least 24 of 28 days; tier minimums met on 80% of days; corrections under 2%; zero unsourced stories; reviewers keep at least 90% of AI tags.
- **Readers (minimum / goal / great):** signed-in 15 / 30 / 60; reading 3+ days a week 8 / 15 / 30; half of editions reach "You're all caught up".
- **AI:** 95% of summaries pass the word limits in both languages first time.
- **Community:** rewritten README and CONTRIBUTING guide (done 8 Oct 2026), 5 starter issues, 1 outside contribution.
- **Go-formal gate:** production targets met AND (15 weekly readers OR 3 outside contributors).
- **North Star:** weekly readers who open an edition on 3 or more distinct days.
- **State coverage is measured, not guaranteed.** 50 approved stories a day cannot give every reader 15 own-state stories across 36 states and UTs. The tier minimum is a config target; the measures are average own-state cards per reader per day, and the share of readers who got at least 5. Baselines are set in pilot week 1.
- **T0** is the first day a reviewed story is published by the new pipeline. Before T0: the word-limit validator is live; the source list is confirmed and reuse terms checked; the Hindi evaluation has passed; the review screen and publish action are live and the stopgap routine is switched off; the landing page is corrected; the grievance route is live.
- **Pilot tasks:** set baselines in week 1; run the Hindi overflow test; observe or interview at least 5 readers of the kind Saransh is for, since no primary research exists yet.

### 14.8 Suggested build order

| # | Step | Depends on | Done |
|---|---|---|---|
| 1 | Landing page copy and token corrections (14.6) | code freeze lifts | ☐ |
| 2 | Word-limit validator + tests (14.4 #2) | — | ☐ |
| 3 | Fix the Alembic baseline; restrict autogenerate to Saransh-owned tables (14.4 #4) | — | ☐ |
| 4 | Schema changes: `tier`, topic list, own images, statuses, `pipeline_meta`, `corrections` (14.3) | 3 | ☐ |
| 5 | Draft stage, published-only reads and the publish action, shipped together; stopgap routine switched off (14.4 #1, #3) | 4 | ☐ |
| 6 | Source list confirmed + reuse terms checked | founder | ☐ |
| 7 | Pipeline: fetch → summarise → translate → tag → agent check (14.5) | 2, 4, 6 | ☐ |
| 8 | Review screen (side-by-side, approve / edit / kill, tag correction) | 5, 7 | ☐ |
| 9 | Google sign-in, `saransh_user_preferences`, `read_events`, onboarding (14.2, 14.4 #7) | 4 | ☐ |
| 10 | Feed endpoint + swipe deck PWA (14.2, 14.4 #6) | 8, 9 | ☐ |
| 11 | Hindi overflow test, topic labels, illustrations | 10 | ☐ |
| 12 | Analytics and instrumentation for the success numbers (14.7) | 10 | ☐ |
| 13 | Ops hardening (14.4 #5, #8) | — | ☐ |

This order follows PRD v1.1 section 12.

### 14.9 Decisions closed on 8 Oct 2026, and open items

**Closed (founder's decisions):**

| Decision | What was decided |
|---|---|
| Infra | Next.js on Vercel, FastAPI on Cloud Run, Postgres hosted on Supabase (database only). PRD v1.0's "Supabase" and this stack are the same thing. |
| Database | Shared with Rajniti, as ADR 0006 describes. Rajniti owns `users`. |
| Stopgap ingest routine | **Keep it** until the planned pipeline exists. Its conflicts with the product rules (section 11, items 21–24) are accepted for now. |
| Analytics | Build PostHog analytics to match what the privacy page already says (ADR 0004). |
| Guest cards | 6 (was 6–8). |
| Coming-soon pills | Solid border with a "Soon" tag. |
| Hindi label for Civic | "सिविक". |
| Wording | "Edition", not "session". |
| Onboarding | Language, state, optional topics. No username and no district. The earlier GitHub PRD #79 is superseded on these points; its backend-verified sign-in design is kept. |
| Analytics wall | Analytics measures the product and never feeds ranking, suggestions or the tier mix. |
| State coverage | A measured target, not a guarantee (14.7). |
| Grievances and corrections | Raised as GitHub Issues. |
| Documentation | Every pull request that changes how the project works updates this file in the same pull request (`CONTRIBUTING.md`). |
| Code | No code changes yet. Documents first; code work starts when the founder says go. |

**Open:**

- Source list (founder to confirm, or check the database first).
- Local-only AI: a hand-checked Hindi evaluation must pass before ingestion starts; the machine must be on when the pipeline runs.
- Hindi overflow test: a 70-word Hindi story with a 3-line headline is not yet tested.
- A public definition of "official source" (what earns the tick).
- Licence for the prompts and the source registry (the code is MIT).
- A response-time target for grievances, and the names of the three reviewers.
- Public "How we work" page: after the translation approach is final.
- GitHub issues written from the earlier PRD #79 (username, place and feed-shaping) need rewriting or closing to match 14.2.
- While the stopgap routine runs, the landing page's "Human reviewed" and "Verified sources" lines describe the plan, not the stories on the page. Soften the copy (14.6) or accept it until the pipeline ships.
- PRD v1.1 is a draft awaiting the founder's review.
