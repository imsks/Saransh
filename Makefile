.PHONY: up stop migrate migrate-prod

COMPOSE := docker compose
PYTHON := $(if $(wildcard venv/bin/python),venv/bin/python,python3)

up: migrate
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	$(COMPOSE) up --build -d
	@echo "API http://localhost:8001 | Frontend http://localhost:3001 | Postgres :5433"

stop:
	$(COMPOSE) down

migrate:
	@test -f .env || cp .env.example .env
	$(COMPOSE) up -d --wait postgres
	$(COMPOSE) run --build --rm --no-deps \
		-v "$(CURDIR)/alembic:/app/alembic:ro" \
		-v "$(CURDIR)/alembic.ini:/app/alembic.ini:ro" \
		saransh-api python -m scripts.init_db

migrate-prod:
	@test -n "$$DATABASE_URL" && test "$$CONFIRM_PROD" = "1" || \
		{ echo 'Set DATABASE_URL and CONFIRM_PROD=1 to migrate production.'; exit 1; }
	@$(PYTHON) -m scripts.init_db --production
