#!/usr/bin/env python3
"""Create SQLAlchemy tables for local development."""

from app.db import models  # noqa: F401
from app.db.database import Base, engine


def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


if __name__ == "__main__":
    main()
