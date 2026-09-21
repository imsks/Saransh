"""Dockerfile contract: dev + production stages for FastAPI."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCKERFILE = ROOT / "Dockerfile"
DOCKERIGNORE = ROOT / ".dockerignore"


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
    # Cloud Build's docker step runs the legacy builder, which rejects RUN --mount.
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
