#!/usr/bin/env python3
"""Initialize or migrate Saransh-owned tables without changing other products."""

import argparse
import os
from pathlib import Path

from sqlalchemy import inspect
from sqlalchemy.engine import URL, Connection

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from app.db.models import Base
from app.db.ownership import include_name, include_object

ROOT = Path(__file__).resolve().parents[1]
VERSION_TABLE = "alembic_version_saransh"


def migrate_database(connection: Connection) -> None:
    """Bootstrap an empty schema, adopt an exact match, or upgrade its revision."""
    config = Config(str(ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(ROOT / "alembic"))
    config.attributes["connection"] = connection
    context = MigrationContext.configure(
        connection,
        opts={
            "version_table": VERSION_TABLE,
            "include_name": include_name,
            "include_object": include_object,
            "compare_server_default": True,
        },
    )

    if context.get_current_revision() is None:
        existing = set(inspect(connection).get_table_names()) & set(
            Base.metadata.tables
        )
        if existing:
            if existing != set(Base.metadata.tables) or compare_metadata(
                context, Base.metadata
            ):
                raise RuntimeError(
                    "Refusing to stamp an unversioned Saransh schema that differs "
                    "from the models. Verify its migration baseline before retrying."
                )
        else:
            Base.metadata.create_all(bind=connection)
        command.stamp(config, "head")

    command.upgrade(config, "head")


def validate_target(url: URL, production: bool) -> None:
    """Require separate, explicit consent for a remote PostgreSQL database."""
    local_hosts = {"localhost", "127.0.0.1", "::1", "postgres"}
    if url.get_backend_name() != "postgresql" or not url.host:
        raise RuntimeError("Migrations require a PostgreSQL DATABASE_URL.")
    if production:
        if not os.environ.get("DATABASE_URL") or os.environ.get("CONFIRM_PROD") != "1":
            raise RuntimeError("Set DATABASE_URL and CONFIRM_PROD=1 for production.")
        if url.host in local_hosts:
            raise RuntimeError("Use make migrate for the local database.")
    elif url.host not in local_hosts:
        raise RuntimeError("Refusing a remote database. Use make migrate-prod.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--production", action="store_true")
    arguments = parser.parse_args()

    from app.db.database import engine

    try:
        validate_target(engine.url, arguments.production)
        with engine.begin() as connection:
            migrate_database(connection)
    except RuntimeError as error:
        parser.exit(1, f"{error}\n")
    print("Saransh database is at the latest migration.")


if __name__ == "__main__":
    main()
