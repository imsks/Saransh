"""Alembic wiring contract."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from sqlalchemy import DefaultClause, Uuid, create_engine, inspect, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine import make_url

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
from app.db.models import Base
from app.db.ownership import SARANSH_OWNED_TABLES, include_name, include_object

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_PY = REPO_ROOT / "alembic" / "env.py"


def _script_directory() -> ScriptDirectory:
    return ScriptDirectory.from_config(Config(str(REPO_ROOT / "alembic.ini")))


def test_alembic_uses_a_saransh_specific_version_table():
    # Rajniti owns the default `alembic_version` on the Postgres instance both share.
    text = ENV_PY.read_text()
    assert 'VERSION_TABLE = "alembic_version_saransh"' in text
    assert text.count("version_table=VERSION_TABLE") == 2


def test_alembic_only_looks_at_saransh_owned_tables():
    text = ENV_PY.read_text()
    assert text.count("include_name=include_name") == 2
    assert text.count("include_object=include_object") == 2


def test_every_model_table_is_registered_as_saransh_owned():
    # A new table must be added to SARANSH_OWNED_TABLES on purpose, or
    # autogenerate will silently ignore it. Rajniti's `users` is mapped, never owned.
    assert set(Base.metadata.tables) == SARANSH_OWNED_TABLES | {"users"}


def _dropped_tables(connection, **filters) -> set[str]:
    context = MigrationContext.configure(connection, opts=filters)
    return {
        diff[1].name
        for diff in compare_metadata(context, Base.metadata)
        if diff[0] == "remove_table"
    }


def test_autogenerate_never_proposes_dropping_another_products_table():
    """Production Postgres is shared with Rajniti; its tables are not ours to drop."""
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE user_politicians (id TEXT PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE alembic_version (version_num TEXT)"))

        # Without the filters this is exactly what autogenerate would write.
        assert "user_politicians" in _dropped_tables(connection)

        assert (
            _dropped_tables(
                connection, include_name=include_name, include_object=include_object
            )
            == set()
        )


def test_autogenerate_never_alters_rajnitis_users_table():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id TEXT PRIMARY KEY)"))
        context = MigrationContext.configure(
            connection,
            opts={"include_name": include_name, "include_object": include_object},
        )
        diffs = compare_metadata(context, Base.metadata)

        assert diffs
        assert "users" not in repr(diffs)


def test_migration_runner_creates_the_users_stub_only_when_asked():
    from scripts.init_db import migrate_database

    for users_stub in (False, True):
        engine = create_engine("sqlite:///:memory:")
        with engine.begin() as connection:
            migrate_database(connection, users_stub=users_stub)
            tables = set(inspect(connection).get_table_names())

            assert SARANSH_OWNED_TABLES <= tables
            assert ("users" in tables) is users_stub
            if users_stub:
                columns = {c["name"] for c in inspect(connection).get_columns("users")}
                assert columns == set(Base.metadata.tables["users"].columns.keys())


def test_suite_never_points_at_a_real_database():
    assert os.environ["DATABASE_URL"].startswith("sqlite:")


def test_revision_graph_has_a_single_head():
    # Two heads means `alembic upgrade head` fails in deploy, not in review.
    assert len(_script_directory().get_heads()) == 1


def test_migration_runner_initializes_an_empty_database_and_is_repeatable():
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE users (id TEXT PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE alembic_version (version_num TEXT)"))
        migrate_database(connection)
        migrate_database(connection)

        assert set(Base.metadata.tables) <= set(inspect(connection).get_table_names())
        assert (
            connection.execute(
                text("SELECT version_num FROM alembic_version_saransh")
            ).scalar_one()
            == _script_directory().get_current_head()
        )
        assert "users" in inspect(connection).get_table_names()
        assert "alembic_version" in inspect(connection).get_table_names()


def test_migration_runner_refuses_a_partial_unversioned_schema():
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE stories (id TEXT PRIMARY KEY)"))
        with pytest.raises(RuntimeError, match="unversioned"):
            migrate_database(connection)
        assert inspect(connection).get_table_names() == ["stories"]


@pytest.fixture
def portable_uuid_types(monkeypatch):
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, UUID):
                monkeypatch.setattr(column, "type", Uuid(as_uuid=True))


def test_migration_runner_adopts_matching_unversioned_tables(portable_uuid_types):
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        Base.metadata.create_all(connection)
        migrate_database(connection)
        assert (
            connection.execute(
                text("SELECT version_num FROM alembic_version_saransh")
            ).scalar_one()
            == _script_directory().get_current_head()
        )


def test_migration_runner_refuses_an_unversioned_schema_with_drift(portable_uuid_types):
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        Base.metadata.create_all(connection)
        connection.execute(text("ALTER TABLE stories ADD COLUMN unexpected TEXT"))
        with pytest.raises(RuntimeError, match="unversioned"):
            migrate_database(connection)
        assert "alembic_version_saransh" not in inspect(connection).get_table_names()


def test_migration_runner_refuses_unversioned_default_drift(
    portable_uuid_types, monkeypatch
):
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        Base.metadata.create_all(connection)
        monkeypatch.setattr(
            Base.metadata.tables["stories"].c.created_at,
            "server_default",
            DefaultClause(text("'2000-01-01'")),
        )
        with pytest.raises(RuntimeError, match="unversioned"):
            migrate_database(connection)
        assert "alembic_version_saransh" not in inspect(connection).get_table_names()


def test_migration_runner_upgrades_a_versioned_database():
    """Both API versions can use the expanded schema without losing legacy data."""
    from scripts.init_db import migrate_database

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.connection.driver_connection.create_function(
            "gen_random_uuid", 0, lambda: str(uuid.uuid4())
        )
        for statement in (
            "CREATE TABLE alembic_version_saransh (version_num VARCHAR(32))",
            "INSERT INTO alembic_version_saransh VALUES ('a7b8c9d0e1f2')",
            "CREATE TABLE stories (id TEXT PRIMARY KEY, title_en TEXT,"
            " title_hi TEXT, summary_en TEXT, summary_hi TEXT, district TEXT,"
            " source_url TEXT)",
            "INSERT INTO stories VALUES"
            " ('s1', 'T', 'टी', 'S', 'एस', 'Nagpur', 'https://canonical.test'),"
            " ('s2', 'T', NULL, 'S', NULL, NULL, NULL),"
            " ('s3', 'T', NULL, 'S', NULL, NULL, 'https://unmatched.test'),"
            " ('s4', 'T', NULL, 'S', NULL, NULL, NULL)",
            "CREATE TABLE sources (id TEXT PRIMARY KEY, story_id TEXT,"
            " outlet TEXT NOT NULL, url TEXT NOT NULL, created_at TIMESTAMP NOT NULL)",
            "INSERT INTO sources VALUES"
            " ('a', 's1', 'Other', 'https://other.test', '2026-01-01'),"
            " ('b', 's1', 'Canonical', 'https://canonical.test', '2026-01-02'),"
            " ('e', 's2', 'Newest', 'https://new.test', '2026-01-02'),"
            " ('d', 's2', 'Tie', 'https://tie.test', '2026-01-01'),"
            " ('c', 's2', 'Oldest', 'https://old.test', '2026-01-01'),"
            " ('f', 's3', 'Unrelated', 'https://unrelated.test', '2026-01-01')",
            "CREATE TABLE waitlist (id INTEGER PRIMARY KEY, name TEXT, email TEXT,"
            " signup_token TEXT NOT NULL, CONSTRAINT uq_waitlist_signup_token"
            " UNIQUE (signup_token))",
            "INSERT INTO waitlist VALUES (1, 'Priya', 'p@test.in', 'tok')",
        ):
            connection.execute(text(statement))

        migrate_database(connection)

        inspector = inspect(connection)
        assert "sources" in inspector.get_table_names()
        assert {c["name"] for c in inspector.get_columns("stories")} == {
            "id",
            "title_en",
            "title_hi",
            "summary_en",
            "summary_hi",
            "district",
            "source_url",
            "source_label",
        }
        assert "signup_token" in {c["name"] for c in inspector.get_columns("waitlist")}
        assert connection.execute(
            text("SELECT title_hi, summary_hi, district FROM stories WHERE id = 's1'")
        ).one() == ("टी", "एस", "Nagpur")
        assert connection.execute(
            text("SELECT source_url, source_label FROM stories ORDER BY id")
        ).all() == [
            ("https://canonical.test", "Canonical"),
            ("https://old.test", "Oldest"),
            ("https://unmatched.test", None),
            (None, None),
        ]
        assert (
            connection.execute(text("SELECT count(*) FROM sources")).scalar_one() == 6
        )
        assert connection.execute(text("SELECT email FROM waitlist")).scalar_one()
        assert (
            connection.execute(text("SELECT signup_token FROM waitlist")).scalar_one()
            == "tok"
        )
        connection.execute(
            text("INSERT INTO waitlist (name, email) VALUES ('New', 'new@test.in')")
        )
        connection.execute(
            text("INSERT INTO waitlist (name, email) VALUES ('Next', 'next@test.in')")
        )
        tokens = (
            connection.execute(text("SELECT signup_token FROM waitlist"))
            .scalars()
            .all()
        )
        assert all(tokens)
        assert len(set(tokens)) == 3
        assert (
            connection.execute(
                text("SELECT version_num FROM alembic_version_saransh")
            ).scalar_one()
            == _script_directory().get_current_head()
        )


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1", "[::1]", "postgres"])
def test_local_migration_accepts_only_local_postgres(host):
    from scripts.init_db import validate_target

    validate_target(make_url(f"postgresql://u:p@{host}/db"), production=False)


def test_local_migration_refuses_remote_postgres():
    from scripts.init_db import validate_target

    with pytest.raises(RuntimeError, match="migrate-prod"):
        validate_target(
            make_url("postgresql://u:p@db.example.com/db"), production=False
        )


def test_production_migration_validates_explicit_consent(monkeypatch):
    from scripts.init_db import validate_target

    remote = make_url("postgresql://u:p@db.example.com/db")
    monkeypatch.delenv("CONFIRM_PROD", raising=False)
    with pytest.raises(RuntimeError, match="CONFIRM_PROD"):
        validate_target(remote, production=True)
    monkeypatch.setenv("CONFIRM_PROD", "1")
    monkeypatch.delenv("DATABASE_URL")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        validate_target(remote, production=True)
    monkeypatch.setenv("DATABASE_URL", str(remote))
    validate_target(remote, production=True)
    with pytest.raises(RuntimeError, match="local"):
        validate_target(make_url("postgresql://u:p@localhost/db"), production=True)


def test_migration_refuses_non_postgres():
    from scripts.init_db import validate_target

    with pytest.raises(RuntimeError, match="PostgreSQL"):
        validate_target(make_url("sqlite:///:memory:"), production=False)


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


def test_citation_expansion_downgrade_preserves_legacy_schema():
    module = _script_directory().get_revision("b8c9d0e1f2a3").module

    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE stories (id TEXT PRIMARY KEY, source_url TEXT,"
                " title_hi TEXT, summary_hi TEXT, district TEXT, source_label TEXT)"
            )
        )
        connection.execute(text("CREATE TABLE sources (id TEXT PRIMARY KEY)"))
        connection.execute(
            text(
                "CREATE TABLE waitlist (id INTEGER PRIMARY KEY,"
                " signup_token TEXT NOT NULL DEFAULT (gen_random_uuid()))"
            )
        )
        with Operations.context(MigrationContext.configure(connection)):
            module.downgrade()

        inspector = inspect(connection)
        assert "sources" in inspector.get_table_names()
        assert {"title_hi", "summary_hi", "district"} <= {
            c["name"] for c in inspector.get_columns("stories")
        }
        assert "signup_token" in {c["name"] for c in inspector.get_columns("waitlist")}
        assert "source_label" not in {
            c["name"] for c in inspector.get_columns("stories")
        }
        assert (
            next(
                c
                for c in inspector.get_columns("waitlist")
                if c["name"] == "signup_token"
            )["default"]
            is None
        )
