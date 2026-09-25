# 📰 Saransh — AI-Powered News Aggregation

India's news. Sourced, summarised, accountable.

Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.

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

`make up` starts Saransh's **own** Postgres container (`saransh-postgres`). Nothing else is
required — do not point `DATABASE_URL` at a Rajniti instance or at `host.docker.internal`.

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
| `make deploy` | Deploy the API to Cloud Run — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

---

## 🚀 Deployment

The API runs on **Cloud Run**, the frontend on **Vercel** — the same shape as Rajniti, with its own
ports and service names. Deploys are human-triggered via a committed script, not CI.

```bash
DATABASE_URL=... SARANSH_INGEST_API_KEY=... CORS_ORIGINS=https://your-frontend \
  GCP_PROJECT_ID=your-project make deploy
```

Images are tagged with the commit SHA (never `latest`) and the script refuses to deploy from a
dirty working tree. Full reference — one-time GCP setup, runtime variables, migrations, rollback —
is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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

Automated ingestion runs off a scheduled Claude Code routine that calls `POST /api/v1/stories` —
prompt and setup in [docs/story-ingest-routine.md](docs/story-ingest-routine.md).

---

## 📁 Repository Structure

```
saransh/
├── app/
│   ├── api/              # stories, waitlist, health
│   ├── db/               # SQLAlchemy models + bootstrap
│   └── utils/            # logging
├── docs/                 # DEPLOYMENT.md, ADRs, specs
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

If a component is generic enough for Rajniti to want it too, it belongs in Sutra, not here.

---

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it covers branching, house rules, the PR
template, and the one rule that matters most: **never publish an unsourced Summary.**

- [Good first issues](https://github.com/imsks/Saransh/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- Agent briefs for AI-assisted work: [`.github/agents/`](.github/agents/)
- Domain glossary: [CONTEXT.md](CONTEXT.md)

## 📄 License

[MIT](LICENSE)
