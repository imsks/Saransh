"""Alembic wiring contract."""

from __future__ import annotations

import os
from pathlib import Path
from unittest import mock
from unittest.mock import MagicMock

from sqlalchemy import Column, MetaData, String, Table, create_engine, inspect, text

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
from app.db.models import Base

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PY = REPO_ROOT / "alembic" / "env.py"


def _script_directory() -> ScriptDirectory:
    return ScriptDirectory.from_config(Config(str(REPO_ROOT / "alembic.ini")))


def test_alembic_uses_a_saransh_specific_version_table():
    # Rajniti owns the default `alembic_version` on the Postgres instance both share.
    text = ENV_PY.read_text()
    assert 'VERSION_TABLE = "alembic_version_saransh"' in text
    assert text.count("version_table=VERSION_TABLE") == 2


def test_alembic_filters_autogenerate_in_both_modes():
    # Offline and online must share the ownership filter, or one of them can
    # still generate a revision that drops Rajniti's tables.
    assert ENV_PY.read_text().count("include_object=include_object") == 2


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


def _load_env_module():
    """Execute `alembic/env.py` with the Alembic context stubbed out.

    Importing env.py normally runs the migrations; the stub makes the module's
    definitions available without touching a database.
    """
    namespace: dict = {}
    stub = MagicMock()
    stub.config.config_file_name = None
    stub.is_offline_mode.return_value = True
    with mock.patch("alembic.context", stub):
        exec(compile(ENV_PY.read_text(), str(ENV_PY), "exec"), namespace)
    return namespace


def test_include_object_filters_out_rajniti_owned_tables():
    # Rajniti owns `users`; autogenerate must never see it.
    include_object = _load_env_module()["include_object"]

    assert include_object(None, "users", "table", True, None) is False
    assert include_object(None, "stories", "table", True, None) is True


def test_include_object_follows_table_ownership_for_columns():
    include_object = _load_env_module()["include_object"]
    rajniti_column = Column("email", String)
    Table("users", MetaData(), rajniti_column)
    saransh_column = Column("headline", String)
    Table("stories", MetaData(), saransh_column)

    assert include_object(rajniti_column, "email", "column", True, None) is False
    assert include_object(saransh_column, "headline", "column", True, None) is True


def test_autogenerate_proposes_no_changes_to_rajniti_owned_tables():
    """A database carrying Rajniti's tables yields a diff that ignores them."""
    include_object = _load_env_module()["include_object"]

    engine = create_engine("sqlite:///:memory:")
    with engine.connect() as connection:
        connection.execute(
            text("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)")
        )
        migration_context = MigrationContext.configure(
            connection,
            opts={
                "target_metadata": Base.metadata,
                "include_object": include_object,
            },
        )
        diffs = compare_metadata(migration_context, Base.metadata)

    rendered = [str(diff) for diff in diffs]
    assert all("users" not in diff for diff in rendered)
    # The Saransh-owned tables are still compared.
    assert any("stories" in diff for diff in rendered)
