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

# Reads DATABASE_URL from $(PROD_ENV) (an exported DATABASE_URL is the fallback).
PROD_ENV ?= .env.production

migrate-prod:
	@url="$$($(PYTHON) -c "from dotenv import dotenv_values; print(dotenv_values('$(PROD_ENV)').get('DATABASE_URL') or '')" 2>/dev/null)"; \
	url="$${url:-$$DATABASE_URL}"; \
	test -n "$$url" || { echo 'Add DATABASE_URL to $(PROD_ENV).'; exit 1; }; \
	DATABASE_URL="$$url" CONFIRM_PROD=1 $(PYTHON) -m scripts.init_db --production
