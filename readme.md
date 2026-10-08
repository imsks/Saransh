# 📰 Saransh (सारांश)

**शोर नहीं। सिर्फ़ खबर। सबूत के साथ।**
**No noise. Just news. With proof.**

Saransh is an open-source news app for India. It gives a reader up to 50 short, sourced stories a day, in Hindi or English, with no personalisation and no algorithm. Every story is at most 60 words in English or 70 in Hindi, carries its source and a link out, and is approved by a person before it is published.

It is built in public as a portfolio project and is open to community contribution. Its real competitor is the WhatsApp forward: free and instant, but unsourced and often wrong.

Sister project: [Rajniti](https://rajniti-app.vercel.app/).

---

## What makes it different

- **No personalisation.** Topics are a filter the reader chooses and can see. Nothing is learned from clicks or reading time.
- **Open source as the trust mechanism.** The code, the prompts, the source list and the corrections are public, so "no bias" is something you can audit.
- **A feed with an end.** 50 stories a day, in editions of 15, 15, 10 and 10, then "You're all caught up".
- **Hindi and English are equal.** The reader picks one; nothing is pre-selected.
<!-- - **A person approves every story**, reading both languages. AI drafts and checks; it never publishes. -->

## What the product is

| | |
|---|---|
| **Reader app** | An installable web app (PWA) with Google sign-in. One swipeable card per story. Guests see 6 stories, then a sign-in wall. |
| **Three tiers, one feed** | **National**, **State** (from national sources, tagged by state) and **International** (only when India is named or affected). No district tier. |
| **Topics** | Politics, Civic, Education, Business & Economy, Crime. Entertainment and Sports are "coming soon". |
| **Card** | Image, topic label, headline, body, time, source, and a "Read story" link to the original. A green tick appears only for official sources. Images are an official photo or a Saransh illustration, never a publisher's image. |

### The planned pipeline

```
Approved sources (RSS, licensed feeds, official sources; no scraping of article pages)
  → fetch and dedupe
  → summarise and translate (local AI, Ollama)
  → tag tier, state and topic
  → agent first-pass check (word limits, attribution, summary matches source)
  → a person approves, edits or kills the story
  → publish with a link to the source
```

### Rules that never break

1. Hard word limit: English ≤ 60 words, Hindi ≤ 70. Rejected, never warned.
2. Zero unsourced stories.
3. Attribution and a link out on every story.
4. No publisher-image hotlinking.
5. A person approves every story before it is published.
6. No personalisation.
7. Hindi and English are equal.
8. Everything trust-related is public: corrections, grievance route, source list, prompts.

---

## Status: what is true today

Saransh has not launched. This section is kept honest on purpose.

**Built:** the landing page with a waitlist and a privacy page ([saransh-app.vercel.app](https://saransh-app.vercel.app)), an API that receives and serves stories, the database, and the tooling to run, test and deploy all of it.

**Not built yet:** the pipeline above, the review screen, the reader app, sign-in, and analytics.

**Known gaps between the rules and the code:**

- Stories reach the site today through a temporary scheduled routine ([docs/story-ingest-routine.md](docs/story-ingest-routine.md)), not the planned pipeline. They are published as they arrive, without human review, and may carry a publisher's image. This breaks rules 4 and 5. It is a recorded, temporary exception that ends when the pipeline and the publish step exist, before the pilot starts.
- There is no word-limit check yet (rule 1).
- The landing page still carries older wording, including claims about human review and a public pipeline that are ahead of the product.

The full, current picture of the code is in **[docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)**: what exists, how it works, what will surprise you, and what is planned. Read it before you build anything.

**Next:** a 4-week pilot with real stories across all three tiers, every one approved by a person. Later phases: politician-wise news on Rajniti profiles (V2), then citizen reporting (V3).

---

## Pick a setup path

| Goal | Command | What you get |
|------|---------|--------------|
| **First time** | `make setup` | Copies `.env` templates |
| **Start** | `make up` | API `:8001` + Next.js `:3001` + Postgres `:5433` |
| **Stop** | `make stop` | Stops Docker containers |
| **Ship** | `make deploy` | Builds, pushes and deploys the API to Cloud Run |

> **Port note:** API defaults to `:8001` (Rajniti uses `:8000`). Postgres publishes on `:5433` so it can run beside Rajniti on `:5432`.

---

## Quick Start — Docker (recommended)

**Prerequisites:** Docker Desktop (or Docker Engine + Compose v2).

```bash
git clone https://github.com/imsks/Saransh.git && cd Saransh
make setup   # copies .env.example → .env, frontend/.env.example → frontend/.env
make up      # API + Next.js + Postgres
```

**Verify**

```bash
curl http://localhost:8001/api/v1/health          # API
open http://localhost:3001                         # frontend
```

**First `make up` note:** Frontend dependencies install during `docker compose build` (you may see npm output in the build log). After you change `package.json` / `package-lock.json`, rebuild the web image: `docker compose build saransh-web`.

```bash
make stop    # when you're done
```

---

## Database — local Postgres

`make up` starts a local Postgres container (`saransh-postgres`) for development. Nothing else is
required — do not point `DATABASE_URL` at a Rajniti instance or at `host.docker.internal`.

In production, Saransh and Rajniti share one Postgres database, hosted on Supabase. Rajniti owns the
`users` table; Saransh owns `stories`, `sources` and `waitlist`. A Saransh migration must never
create or alter a table Saransh does not own. See
[ADR 0006](docs/adr/0006-shared-database-and-users.md).

| Who connects | Host | Port |
|--------------|------|------|
| API container (inside Compose) | `postgres` | `5432` |
| You, from your machine (`psql`, GUI) | `127.0.0.1` | `5433` |

Default credentials: user `rajniti`, password `rajniti`, database `rajniti` (override with
`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT`).

**Open a psql shell**

```bash
# via the container — no local psql install needed
docker compose exec postgres psql -U rajniti -d rajniti

# or from your machine, against the published port
psql "postgresql://rajniti:rajniti@127.0.0.1:5433/rajniti"
```

**Running the API on the host instead of in Docker?** Use the published port in `.env`:

```bash
DATABASE_URL=postgresql://rajniti:rajniti@127.0.0.1:5433/rajniti
```

**Troubleshooting `connection to server at "host.docker.internal" … Connection refused`**
Your `.env` is pointing outside the Compose network. Reset `DATABASE_URL` to
`postgresql://rajniti:rajniti@postgres:5432/rajniti`, then `docker compose up -d --force-recreate saransh-api`.
Check the DB is healthy with `docker compose ps postgres`.

**Reset the database** (destroys all local data):

```bash
docker compose down -v && make up
```

---

## Quick Start — Local (no Docker)

**Prerequisites:** Python 3.11+, Node 20+, PostgreSQL.

```bash
git clone https://github.com/imsks/Saransh.git && cd Saransh
make setup
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL in .env
PYTHONPATH=. python scripts/init_db.py
uvicorn main:app --host 0.0.0.0 --port 8001 --reload   # API on :8001
```

**Frontend (separate terminal):**

```bash
cd frontend && npm ci && npm run dev   # http://localhost:3001
```

---

## Makefile

| Command | Description |
|---------|-------------|
| `make setup` | Copy `.env` templates (safe to re-run) |
| `make up` | Start API + frontend + Postgres |
| `make stop` | Stop Docker containers |
| `make migrate` | Apply Alembic migrations to the running local Postgres |
| `make revision m="describe the change"` | Autogenerate a migration |
| `make deploy` | Deploy the API to Cloud Run — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

`make migrate` and `make revision` refuse to run against a database that is not local unless you
pass `CONFIRM_REMOTE=1`, because the production database is shared with Rajniti.

---

## 🚀 Deployment

The frontend runs on **Vercel**, the API on **Google Cloud Run**, and the database is Postgres hosted
on **Supabase** (database only). Deploys are human-triggered via a committed script, not CI.

```bash
DATABASE_URL=... SARANSH_INGEST_API_KEY=... CORS_ORIGINS=https://your-frontend \
  GCP_PROJECT_ID=your-project make deploy
```

Images are tagged with the commit SHA (never `latest`), the script applies database migrations
before the new revision goes live, and it refuses to deploy from a dirty working tree. Full
reference — one-time GCP setup, runtime variables, migrations, rollback — is in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Environment variables

See [`.env.example`](.env.example) and [`frontend/.env.example`](frontend/.env.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. `postgres:5432` in Docker, `127.0.0.1:5433` from the host |
| `SARANSH_INGEST_API_KEY` | Yes* | Protects `POST /api/v1/stories` |
| `CORS_ORIGINS` | No | Comma-separated browser origins allowed to call the API. Defaults to the local frontend |
| `LOG_LEVEL` | No | Backend log level (default `INFO`). Console output locally, JSON when `APP_ENV=production` |
| `NEXT_PUBLIC_LOG_LEVEL` | No | Frontend log level (default `debug` locally, `info` in production) |

\* Required in production; set any secret for local ingest testing.

**API surface**

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/v1/stories` | `X-API-Key` | Ingest a structured story |
| `GET /api/v1/stories` | Public | List stories |
| `GET /api/v1/stories/{id}` | Public | Story detail |
| `POST /api/v1/waitlist` | Public | Join launch waitlist |
| `GET /api/v1/health` | Public | Health check |

---

## 📁 Repository Structure

```
saransh/
├── app/
│   ├── api/              # stories, waitlist, health
│   ├── schemas/          # request and response shapes
│   ├── db/               # SQLAlchemy models, repositories, bootstrap
│   ├── agents/           # empty today; the planned pipeline goes here
│   └── utils/            # logging
├── alembic/              # database migrations
├── docs/                 # PROJECT_STATE.md, DEPLOYMENT.md, ADRs
├── frontend/             # Next.js frontend
├── scripts/              # DB init, Cloud Run deploy
├── tests/
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── main.py
```

## 🧪 Testing

```bash
source venv/bin/activate && pytest tests/ -v
cd frontend && npm test
```

### Code quality

```bash
pip install -r requirements-test.txt
pre-commit install                       # once

black app tests scripts && isort app tests scripts
flake8 app tests scripts && mypy app

cd frontend && npm run lint && npm run typecheck
```

CI runs all of the above plus a production frontend build — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 🎨 Design system — Sutra

Saransh's UI primitives come from [Sutra](https://github.com/imsks/sutra-ui), the shared
open-source design system it uses alongside Rajniti.

```tsx
import { Button, Card, Input, Badge, ThemeToggle } from "@sutra_ui/ui";
```

`frontend/src/app/globals.css` imports `@sutra_ui/tokens/css` and then re-skins the
`--sutra-*` variables to Saransh's newsprint palette — warm paper, near-black ink,
masthead red as the accent. Sutra components inherit that look with **no forking**, and the
whole palette flips under `.dark`, so light and dark come from one source of truth.

Style with the theme colour names (`bg-paper`, `text-ink`, `border-line`), never a hex value.
If a component is generic enough for Rajniti to want it too, it belongs in Sutra, not here.

---

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it covers branching, house rules, the PR
template, and the two rules that matter most: **never publish an unsourced Summary**, and
**update [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) in the same pull request as your change.**

- [Good first issues](https://github.com/imsks/Saransh/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- Current state of the code: [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)
- Decisions and their reasons: [docs/adr/](docs/adr/)
- Found a wrong story or a wrong attribution? [Open an issue](https://github.com/imsks/Saransh/issues/new). Corrections and grievances are handled in public.

## 📄 License

[MIT](LICENSE)

---

Product and documentation: Pratyusha Trivedi. Built in public with the Saransh contributors.
