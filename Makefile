# Saransh — setup, up, stop.
# Postgres is shared with Rajniti: cd ../Rajniti && make up
.PHONY: setup up stop

COMPOSE := docker compose

setup: ## Copy .env templates (safe to re-run)
	@test -f .env || cp .env.example .env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "Env files ready. Shared Postgres: cd ../Rajniti && make up"
	@echo "Then: make up"

up: setup ## Start API :8001 + Redis :6379 + Chroma :8002
	$(COMPOSE) up --build -d
	@echo "Saransh is up — API http://localhost:8001  Redis :6379  Chroma :8002"
	@echo "Frontend: cd frontend && npm run dev  (http://localhost:3001)"

stop: ## Stop containers
	$(COMPOSE) down
