"""Container contracts: API, frontend and PostgreSQL in development/production."""

from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
COMPOSE = ROOT / "docker-compose.yml"
COMPOSE_PROD = ROOT / "docker-compose.prod.yml"
DOCKERFILE = ROOT / "Dockerfile"
DOCKERIGNORE = ROOT / ".dockerignore"
FRONTEND = ROOT / "frontend"


def test_compose_exposes_api_web_and_postgres():
    data = yaml.safe_load(COMPOSE.read_text())
    assert set(data["services"]) == {"postgres", "saransh-api", "saransh-web"}


def test_compose_api_builds_development_target():
    data = yaml.safe_load(COMPOSE.read_text())
    build = data["services"]["saransh-api"]["build"]
    assert build["context"] == "."
    assert build["target"] == "development"


def test_compose_api_waits_for_postgres():
    data = yaml.safe_load(COMPOSE.read_text())
    depends_on = data["services"]["saransh-api"]["depends_on"]
    assert depends_on["postgres"]["condition"] == "service_healthy"


def test_compose_api_pins_database_url_to_the_compose_postgres():
    data = yaml.safe_load(COMPOSE.read_text())
    database_url = data["services"]["saransh-api"]["environment"]["DATABASE_URL"]
    assert "@postgres:5432/" in database_url
    assert "host.docker.internal" not in database_url


def test_compose_frontend_uses_dockerfile_dev():
    data = yaml.safe_load(COMPOSE.read_text())
    build = data["services"]["saransh-web"]["build"]
    assert build["context"] == "./frontend"
    assert build["dockerfile"] == "Dockerfile.dev"


def test_compose_frontend_mounts_source_not_whole_app():
    data = yaml.safe_load(COMPOSE.read_text())
    mounts = data["services"]["saransh-web"]["volumes"]
    mount_targets = [entry.split(":")[1] for entry in mounts]
    assert "/app/src" in mount_targets
    assert "/app" not in mount_targets


def test_compose_frontend_mounts_only_existing_config_files():
    data = yaml.safe_load(COMPOSE.read_text())
    mounts = data["services"]["saransh-web"]["volumes"]
    for entry in mounts:
        host_path = entry.split(":")[0]
        if host_path.startswith("./frontend/"):
            assert (ROOT / host_path[2:]).exists(), host_path


def test_compose_frontend_has_no_node_modules_volume():
    data = yaml.safe_load(COMPOSE.read_text())
    mounts = data["services"]["saransh-web"].get("volumes", [])
    assert not any("node_modules" in entry for entry in mounts)
    assert "frontend_node_modules" not in data.get("volumes", {})


def test_compose_has_no_redis_or_chroma():
    text = COMPOSE.read_text().lower()
    assert "redis" not in text
    assert "chroma" not in text


def test_prod_compose_builds_production_target():
    data = yaml.safe_load(COMPOSE_PROD.read_text())
    build = data["services"]["saransh-api"]["build"]
    assert build["target"] == "production"


def test_prod_compose_follows_the_injected_port():
    data = yaml.safe_load(COMPOSE_PROD.read_text())
    service = data["services"]["saransh-api"]
    assert service["ports"] == ["${SARANSH_API_PORT:-8001}:${PORT:-8080}"]
    healthcheck = " ".join(service["healthcheck"]["test"])
    assert "$${PORT:-8080}" in healthcheck
    assert "8001" not in healthcheck


def test_dockerfile_has_development_and_production_stages():
    text = DOCKERFILE.read_text()
    assert "FROM base AS development" in text
    assert "FROM base AS production" in text


def test_dockerfile_uses_uvicorn_for_dev_and_gunicorn_for_prod():
    text = DOCKERFILE.read_text()
    assert "uvicorn" in text
    assert "gunicorn" in text
    assert "UvicornWorker" in text


def test_dockerfile_builds_without_buildkit():
    text = DOCKERFILE.read_text()
    assert "--mount" not in text
    assert "# syntax=" not in text


def test_production_stage_serves_the_cloud_run_port():
    production = DOCKERFILE.read_text().split("FROM base AS production", 1)[1]
    assert "PORT=8080" in production
    assert "EXPOSE 8080" in production
    assert "--bind 0.0.0.0:${PORT}" in production


def test_dockerignore_excludes_frontend_and_env_files():
    text = DOCKERIGNORE.read_text()
    assert "frontend/" in text
    assert ".env" in text
    assert "tests/" in text


def test_frontend_dockerfile_installs_dependencies_at_build_time():
    dockerfile = (FRONTEND / "Dockerfile.dev").read_text()
    assert "RUN npm ci" in dockerfile
    assert ".saransh-lock-hash" in dockerfile


def test_frontend_dockerfile_dev_serves_on_3001():
    dockerfile = (FRONTEND / "Dockerfile.dev").read_text()
    assert "node:20-alpine" in dockerfile
    assert "3001" in dockerfile
    assert "docker-entrypoint.sh" in dockerfile


def test_frontend_entrypoint_only_syncs_on_lock_change():
    entrypoint = (FRONTEND / "docker-entrypoint.sh").read_text()
    assert "package-lock.json changed" in entrypoint
    assert ".saransh-lock-hash" in entrypoint
