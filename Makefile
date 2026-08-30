# Saransh — setup, up, stop.
.PHONY: setup up stop

COMPOSE := docker compose

setup: ## Copy .env templates (safe to re-run)
	@test -f .env || cp .env.example .env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "Env files ready. Edit .env if needed, then: make up"

up: setup ## Start API :8001 + frontend :3001 + Postgres :5433
	$(COMPOSE) up --build -d
	@echo "Saransh is up — API http://localhost:8001  frontend http://localhost:3001  Postgres :5433"

stop: ## Stop containers
	$(COMPOSE) down
