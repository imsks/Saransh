# 📰 Saransh — AI-Powered News Aggregation

India's news. Sourced, summarised, accountable.

Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (for Redis + Chroma)
- Shared Postgres from [Rajniti](../Rajniti) on `localhost:5432`

### One-Command Setup

```bash
git clone https://github.com/imsks/Saransh.git
cd Saransh

# Start Rajniti Postgres (separate terminal)
cd ../Rajniti && make dev-api BUILD=0

# Bootstrap Saransh
cd ../Saransh
make bootstrap
make dev
```

This starts:
- **Redis** on `localhost:6379`
- **ChromaDB** on `localhost:8002`
- **FastAPI backend** on `localhost:8001`
- **Next.js frontend** on `localhost:3001`

Postgres is shared with Rajniti (`rajniti` database on port `5432`).

### Manual Setup

```bash
make setup
make install
make frontend-install
make db-init

# Terminal 1 — API
make run

# Terminal 2 — frontend
make frontend-dev
```

## 📁 Repository Structure

```
saransh/
├── app/                  # FastAPI backend
│   ├── agents/           # AI agents (summarization, curation)
│   ├── ai/               # LLM and embedding services
│   ├── api/              # API routes
│   ├── db/               # Database models
│   ├── processors/       # Content processing pipeline
│   ├── scrapers/         # News source scrapers
│   └── utils/            # Shared utilities
├── frontend/             # Next.js frontend
├── scripts/              # DB init and utilities
├── tests/                # Python API tests
├── docs/adr/             # Architecture Decision Records
├── Makefile              # Dev orchestration (like Rajniti)
├── docker-compose.yml    # Redis + Chroma (no local Postgres)
└── main.py               # FastAPI entrypoint
```

## 🛠️ Development Commands

```bash
make help           # Show all commands
make dev            # Full local stack (infra + API + frontend)
make run            # FastAPI only (:8001)
make frontend-dev   # Next.js only (:3001)
make infra-up       # Redis + Chroma
make infra-down     # Stop Docker infra
make db-init        # Create Saransh tables in shared Postgres
make test           # Python + frontend tests
make lint           # Frontend eslint + typecheck
make build          # Production Next.js build
```

## 🧪 Testing

```bash
make test           # All tests
make test COV=1     # Python tests with coverage
cd frontend && npm test
```
