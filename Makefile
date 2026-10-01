# Saransh — setup, up, stop, migrate, revision, deploy.
.PHONY: setup up stop migrate revision deploy

COMPOSE := docker compose

# Alembic runs on the host: the image ships app/ only, not alembic/ or alembic.ini.
# Local default only. Never hardcode a real credential here — this file is tracked.
# Other targets: make migrate MIGRATE_DATABASE_URL="$DATABASE_URL"
MIGRATE_DATABASE_URL ?= postgresql://rajniti:rajniti@127.0.0.1:5433/rajniti
ALEMBIC := DATABASE_URL=$(MIGRATE_DATABASE_URL) $(if $(wildcard venv/bin/alembic),venv/bin/alembic,alembic)

# Saransh shares a Postgres instance with Rajniti today, so a stray remote URL can
# rewrite the wrong schema. Opt in per invocation with CONFIRM_REMOTE=1.
REMOTE_GUARD = @case "$(MIGRATE_DATABASE_URL)" in *@127.0.0.1:*|*@localhost:*) ;; *) test -n "$(CONFIRM_REMOTE)" || { echo 'Refusing: MIGRATE_DATABASE_URL is not local. Re-run with CONFIRM_REMOTE=1 if you mean it.'; exit 1; };; esac

setup: ## Copy .env templates (safe to re-run)
	@test -f .env || cp .env.example .env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "Env files ready. Edit .env if needed, then: make up"

up: setup ## Start API :8001 + frontend :3001 + Postgres :5433
	$(COMPOSE) up --build -d
	@echo "Saransh is up — API http://localhost:8001  frontend http://localhost:3001  Postgres :5433"

stop: ## Stop containers
	$(COMPOSE) down

migrate: ## Apply Alembic migrations to the running Postgres
	$(REMOTE_GUARD)
	$(ALEMBIC) upgrade head

revision: ## Autogenerate a migration: make revision m="describe the change"
	@test -n "$(m)" || { echo 'Usage: make revision m="describe the change"'; exit 1; }
	$(REMOTE_GUARD)
	$(ALEMBIC) revision --autogenerate -m "$(m)"

deploy: ## Build, push and deploy the API to Cloud Run (see docs/DEPLOYMENT.md)
	./scripts/deploy_cloud_run.sh
