"""docker-compose contract: API + web + Postgres."""

from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
COMPOSE = ROOT / "docker-compose.yml"
COMPOSE_PROD = ROOT / "docker-compose.prod.yml"


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


def test_compose_api_does_not_override_database_url():
    data = yaml.safe_load(COMPOSE.read_text())
    assert "environment" not in data["services"]["saransh-api"]


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
