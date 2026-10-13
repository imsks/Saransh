"""Makefile commands and deployment safeguards."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
MAKEFILE = ROOT / "Makefile"
DEPLOY_SCRIPT = ROOT / "scripts" / "deploy_cloud_run.sh"


TARGETS = ["up", "stop", "migrate", "migrate-prod"]


def _public_targets(text: str) -> list[str]:
    return re.findall(r"^([a-zA-Z][a-zA-Z0-9_-]*):", text, re.MULTILINE)


def test_makefile_exposes_only_the_documented_targets():
    targets = _public_targets(MAKEFILE.read_text())
    assert targets == TARGETS


@pytest.mark.parametrize("target", TARGETS)
def test_makefile_target_dry_runs(target: str):
    result = subprocess.run(
        ["make", "-n", target],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr or result.stdout


def test_makefile_up_advertises_api_frontend_and_postgres():
    text = MAKEFILE.read_text()
    assert ":8001" in text
    assert ":3001" in text
    assert "5433" in text


def test_migrate_defaults_to_the_local_database():
    text = MAKEFILE.read_text()
    assert "up -d --wait postgres" in text
    assert "saransh-api python -m scripts.init_db" in text
    assert "MIGRATE_DATABASE_URL" not in text
    assert "up: migrate" in text


@pytest.mark.parametrize(
    "variables",
    [
        {},
        {"DATABASE_URL": "postgresql://u:p@db.example.com:5432/postgres"},
        {"CONFIRM_PROD": "1"},
        {"DATABASE_URL": "postgresql://u:p@db.example.com/db", "CONFIRM_PROD": "0"},
    ],
)
def test_production_migration_requires_url_and_confirmation(variables):
    result = subprocess.run(
        ["make", "migrate-prod"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        env={"PATH": "/usr/bin:/bin", **variables},
    )
    assert result.returncode != 0
    assert "CONFIRM_PROD" in result.stdout + result.stderr
    assert "u:p" not in result.stdout + result.stderr


def test_deploy_script_remains_available_without_a_make_target():
    assert DEPLOY_SCRIPT.exists()


def test_deploy_script_is_executable():
    assert DEPLOY_SCRIPT.stat().st_mode & 0o111


def test_deploy_script_tags_with_the_commit_sha_not_latest():
    text = DEPLOY_SCRIPT.read_text()
    assert "git rev-parse --short HEAD" in text
    assert ":latest" not in text


def test_deploy_script_refuses_a_dirty_tree_unless_overridden():
    text = DEPLOY_SCRIPT.read_text()
    assert "git status --porcelain" in text
    assert "ALLOW_DIRTY" in text


def test_deploy_script_builds_the_production_target():
    assert "--target production" in DEPLOY_SCRIPT.read_text()


def test_deploy_script_does_not_set_port():
    # Cloud Run injects PORT; setting it ourselves would fight the platform.
    assert "PORT=" not in DEPLOY_SCRIPT.read_text()


def test_deploy_script_migrates_before_deploying_the_revision():
    text = DEPLOY_SCRIPT.read_text()
    assert "-m scripts.init_db --production" in text
    assert "CONFIRM_PROD=1" in text
    assert "SKIP_MIGRATIONS" in text
    assert text.index("-m scripts.init_db --production") < text.index(
        "gcloud run deploy"
    )


def test_deploy_script_reports_every_missing_variable_at_once(tmp_path):
    result = subprocess.run(
        [str(DEPLOY_SCRIPT)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        env={"PATH": "/usr/bin:/bin", "HOME": str(tmp_path)},
    )
    assert result.returncode != 0
    for variable in (
        "GCP_PROJECT_ID",
        "DATABASE_URL",
        "SARANSH_INGEST_API_KEY",
        "CORS_ORIGINS",
    ):
        assert variable in result.stderr
