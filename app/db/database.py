from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings
from app.db.config import get_database_url


def _normalize_driver(url: str) -> str:
    """Prefer psycopg2 (Rajniti parity); fall back to psycopg v3 if needed."""
    if url.startswith("postgresql://"):
        try:
            import psycopg2  # noqa: F401

            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        except ImportError:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)

    return url


DATABASE_URL = _normalize_driver(get_database_url(settings.DATABASE_URL))

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
