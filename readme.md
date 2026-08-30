# 📰 Saransh — AI-Powered News Aggregation

India's news. Sourced, summarised, accountable.

Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.

## Pick a setup path

| Goal | Command | What you get |
|------|---------|--------------|
| **First time** | `make setup` | Copies `.env` templates |
| **Start** | `make up` | API `:8001` + Next.js `:3001` + Postgres `:5433` |
| **Stop** | `make stop` | Stops Docker containers |

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

---

## Environment variables

See [`.env.example`](.env.example) and [`frontend/.env.example`](frontend/.env.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SARANSH_INGEST_API_KEY` | Yes* | Protects `POST /api/stories` |

\* Required in production; set any secret for local ingest testing.

**API surface**

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/stories` | `X-API-Key` | Ingest a structured story |
| `GET /api/stories` | Public | List stories |
| `GET /api/stories/{id}` | Public | Story detail |
| `POST /api/v1/waitlist` | Public | Join launch waitlist |
| `GET /api/v1/health` | Public | Health check |

---

## 📁 Repository Structure

```
saransh/
├── app/
│   ├── api/              # stories, waitlist, health
│   ├── db/               # SQLAlchemy models + bootstrap
│   └── utils/            # logging
├── frontend/             # Next.js frontend
├── scripts/              # DB init
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
