"""Create Saransh tables in the shared Rajniti Postgres database."""

from __future__ import annotations

import logging
import os

from app.db.database import Base, engine
from app.db import models  # noqa: F401

logger = logging.getLogger(__name__)


def init_database() -> None:
    """Create Saransh-owned tables if they do not exist."""
    if os.getenv("SKIP_DB_AUTO_CREATE", "").lower() in {"1", "true", "yes"}:
        logger.info("Skipping Saransh table auto-create (SKIP_DB_AUTO_CREATE is set)")
        return

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Saransh tables ensured (stories, sources, waitlist)")
    except Exception as exc:
        logger.warning("Could not initialize Saransh tables: %s", exc)
