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
cd ../Rajniti && make up

# Start Saransh
cd ../Saransh
make setup
make up
```

This starts:
- **Redis** on `localhost:6379`
- **ChromaDB** on `localhost:8002`
- **FastAPI backend** on `localhost:8001`

Postgres is shared with Rajniti (`rajniti` database on port `5432`). Frontend: `cd frontend && npm ci && npm run dev` (http://localhost:3001).

```bash
make stop    # when you're done
```

### Manual Setup

```bash
make setup
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pip install psycopg2-binary email-validator
cd frontend && npm ci
PYTHONPATH=. python scripts/init_db.py

# Terminal 1 — API
source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — frontend
cd frontend && npm run dev
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
├── Makefile              # setup / up / stop
├── docker-compose.yml    # API + Redis + Chroma (no local Postgres)
└── main.py               # FastAPI entrypoint
```

## 🛠️ Makefile

```bash
make setup   # Copy .env templates
make up      # Start API + Redis + Chroma
make stop    # Stop Docker containers
```

## 🧪 Testing

```bash
source venv/bin/activate && pytest tests/ -v
cd frontend && npm test
```
