"""Alembic wiring contract."""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PY = REPO_ROOT / "alembic" / "env.py"


def _script_directory() -> ScriptDirectory:
    return ScriptDirectory.from_config(Config(str(REPO_ROOT / "alembic.ini")))


def test_alembic_uses_a_saransh_specific_version_table():
    # Rajniti owns the default `alembic_version` on the Postgres instance both share.
    text = ENV_PY.read_text()
    assert 'VERSION_TABLE = "alembic_version_saransh"' in text
    assert text.count("version_table=VERSION_TABLE") == 2


def test_suite_never_points_at_a_real_database():
    assert os.environ["DATABASE_URL"].startswith("sqlite:")


def test_revision_graph_has_a_single_head():
    # Two heads means `alembic upgrade head` fails in deploy, not in review.
    assert len(_script_directory().get_heads()) == 1


def test_add_story_source_url_migration_round_trips():
    """The source_url migration adds a nullable column and drops it cleanly."""
    revision = _script_directory().get_revision("e4f5a6b7c8d9")
    module = revision.module

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE stories (id TEXT PRIMARY KEY)"))
        migration_context = MigrationContext.configure(connection)

        with Operations.context(migration_context):
            module.upgrade()
        column = {c["name"]: c for c in inspect(connection).get_columns("stories")}[
            "source_url"
        ]
        assert column["nullable"] is True

        with Operations.context(migration_context):
            module.downgrade()
        remaining = {c["name"] for c in inspect(connection).get_columns("stories")}
        assert "source_url" not in remaining


def test_drop_story_published_at_migration_round_trips():
    """The migration drops published_at and the downgrade restores it from created_at."""
    revision = _script_directory().get_revision("f6a7b8c9d0e1")
    module = revision.module

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE stories ("
                "  id TEXT PRIMARY KEY,"
                "  status TEXT NOT NULL,"
                "  created_at TIMESTAMP NOT NULL,"
                "  published_at TIMESTAMP"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO stories (id, status, created_at, published_at) VALUES"
                " ('a', 'published', '2026-09-30 10:00:00', '2026-09-30 10:00:00')"
            )
        )
        migration_context = MigrationContext.configure(connection)

        with Operations.context(migration_context):
            module.upgrade()
        assert "published_at" not in {
            c["name"] for c in inspect(connection).get_columns("stories")
        }

        with Operations.context(migration_context):
            module.downgrade()
        column = {c["name"]: c for c in inspect(connection).get_columns("stories")}[
            "published_at"
        ]
        assert column["nullable"] is True
        # The downgrade backfills the column it cannot otherwise recover.
        restored = connection.execute(
            text("SELECT published_at FROM stories WHERE id = 'a'")
        ).scalar_one()
        assert str(restored).startswith("2026-09-30 10:00:00")


def test_add_waitlist_signup_token_migration_round_trips():
    """The migration backfills a distinct Signup Token on every existing row."""
    revision = _script_directory().get_revision("a7b8c9d0e1f2")
    module = revision.module

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE waitlist ("
                "  id INTEGER PRIMARY KEY AUTOINCREMENT,"
                "  name TEXT NOT NULL,"
                "  email TEXT NOT NULL UNIQUE"
                ")"
            )
        )
        connection.execute(
            text(
                "INSERT INTO waitlist (name, email) VALUES"
                " ('Priya', 'priya@example.com'), ('Arjun', 'arjun@example.com')"
            )
        )
        migration_context = MigrationContext.configure(connection)

        with Operations.context(migration_context):
            module.upgrade()
        column = {c["name"]: c for c in inspect(connection).get_columns("waitlist")}[
            "signup_token"
        ]
        assert column["nullable"] is False
        tokens = [
            row[0]
            for row in connection.execute(
                text("SELECT signup_token FROM waitlist")
            ).fetchall()
        ]
        assert len(tokens) == 2
        assert all(tokens)
        assert len(set(tokens)) == 2

        with Operations.context(migration_context):
            module.downgrade()
        remaining = {c["name"] for c in inspect(connection).get_columns("waitlist")}
        assert "signup_token" not in remaining
