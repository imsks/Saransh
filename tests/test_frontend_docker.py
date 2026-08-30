"""Frontend Docker dev image contract."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"


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
