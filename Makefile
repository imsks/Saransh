# Saransh Makefile — mirrors Rajniti layout (app/ + frontend/).
# Postgres is shared with Rajniti: cd ../Rajniti && make dev-api

.PHONY: help setup bootstrap install install-dev run dev dev-api dev-build stop \
	frontend-install frontend-dev test lint build db-init infra-up infra-down logs

VENV := . venv/bin/activate &&
PYTHON ?= python3
BUILD ?= 1
COV ?=
API_PORT ?= 8001
FRONTEND_PORT ?= 3001
COMPOSE := docker compose

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── First-time setup ────────────────────────────────────────────────────────────

setup: ## Copy env templates (safe to re-run)
	@test -f .env || cp .env.example .env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "Env files ready."
	@echo "Start shared Postgres: cd ../Rajniti && make dev-api BUILD=0"

bootstrap: setup install frontend-install db-init ## First-time: env + deps + DB tables
	@echo "Bootstrap complete. Run: make dev"

install: ## Create venv and install Python deps
	$(PYTHON) -m venv venv
	$(VENV) pip install -U pip
	$(VENV) pip install -r requirements.txt
	$(VENV) pip install psycopg2-binary email-validator

install-dev: install ## + pytest for local test runs
	$(VENV) pip install pytest

# ── Local (no Docker API) ─────────────────────────────────────────────────────

run: ## FastAPI on :8001 (requires venv + Rajniti Postgres)
	@test -d venv || (echo "Run 'make install' first." && exit 1)
	$(VENV) uvicorn main:app --host 0.0.0.0 --port $(API_PORT) --reload

frontend-install: ## npm ci in frontend/
	cd frontend && npm ci

frontend-dev: ## Next.js dev server on :3001
	cd frontend && npm run dev

# ── Docker ────────────────────────────────────────────────────────────────────

dev: setup ## Local full stack: Redis + Chroma + API :8001 + frontend :3001
	$(COMPOSE) up -d redis chroma
	@npx --yes concurrently -n api,web -c blue,green \
		"$(MAKE) run" "$(MAKE) frontend-dev"

dev-api: setup ## Docker: Saransh API container + Redis + Chroma
	@if [ "$(BUILD)" = "1" ]; then \
		$(COMPOSE) up --build saransh-api redis chroma; \
	else \
		$(COMPOSE) up saransh-api redis chroma; \
	fi

dev-build: ## Rebuild Docker images without starting containers
	$(COMPOSE) build

stop: ## Stop Docker containers
	$(COMPOSE) down

logs: ## Tail Docker logs (SERVICE=saransh-api|redis|chroma)
	$(COMPOSE) logs -f $(SERVICE)

infra-up: ## Start Redis + Chroma only
	$(COMPOSE) up -d redis chroma

infra-down: ## Stop Redis + Chroma
	$(COMPOSE) down redis chroma

# ── Database ──────────────────────────────────────────────────────────────────

db-init: ## Create Saransh tables in shared Rajniti Postgres
	@test -d venv || (echo "Run 'make install' first." && exit 1)
	$(VENV) PYTHONPATH=. python scripts/init_db.py

# ── Test & quality ────────────────────────────────────────────────────────────

test: ## Run Python + frontend tests (COV=1 for coverage)
	@test -d venv || (echo "Run 'make install-dev' first." && exit 1)
	$(VENV) pytest tests/ -v $(if $(COV),--cov=app --cov-report=term-missing,)
	cd frontend && npm test

lint: ## Frontend eslint + typecheck
	cd frontend && npm run lint
	cd frontend && npm run typecheck

build: ## Production build (Next.js)
	cd frontend && npm run build
