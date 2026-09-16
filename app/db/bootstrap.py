"""Create Saransh tables in the shared Rajniti Postgres database."""

from __future__ import annotations

import os

from app.db import models  # noqa: F401
from app.db.database import Base, engine
from app.utils import get_logger

logger = get_logger(__name__)


def init_database() -> None:
    """Create Saransh-owned tables if they do not exist."""
    if os.getenv("SKIP_DB_AUTO_CREATE", "").lower() in {"1", "true", "yes"}:
        logger.info("db.auto_create_skipped")
        return

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("db.tables_ensured", tables="stories, sources, waitlist")
    except Exception as exc:
        logger.warning("db.init_failed", error=str(exc))
