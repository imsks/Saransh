"""
Pytest configuration and fixtures for Saransh tests.

The test suite uses an in-memory SQLite database to avoid requiring a running
PostgreSQL instance.  Because the application models use the PostgreSQL-specific
UUID dialect type, we:

1. Override environment variables *before* any application module is imported
   so that the SQLAlchemy engine created in ``app.db.database`` points at SQLite.
2. Patch the PostgreSQL UUID column type to be transparent on SQLite.
3. Build a minimal FastAPI application that registers only the stories router
   to avoid any startup side-effects from agents or scrapers.
"""
import os
import uuid
from typing import Generator

# ---------------------------------------------------------------------------
# 1. Set env vars before any application module is imported
# ---------------------------------------------------------------------------
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("OPENAI_API_KEY", "test-key-not-used")
os.environ.setdefault("SARANSH_INGEST_API_KEY", "test-api-key")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

# ---------------------------------------------------------------------------
# 2. Patch the PostgreSQL UUID type to work transparently with SQLite
# ---------------------------------------------------------------------------
from sqlalchemy.dialects.postgresql import UUID as PG_UUID  # noqa: E402
from sqlalchemy.types import CHAR  # noqa: E402


def _pg_uuid_load_dialect_impl(self, dialect):
    if dialect.name == "sqlite":
        return dialect.type_descriptor(CHAR(36))
    return self.__class__.__bases__[0].load_dialect_impl(self, dialect)


def _pg_uuid_process_bind_param(self, value, dialect):
    if dialect.name == "sqlite":
        return None if value is None else str(value)
    return self.__class__.__bases__[0].process_bind_param(self, value, dialect)


def _pg_uuid_process_result_value(self, value, dialect):
    if dialect.name == "sqlite":
        if value is None:
            return None
        return uuid.UUID(str(value)) if self.as_uuid else str(value)
    return self.__class__.__bases__[0].process_result_value(self, value, dialect)


PG_UUID.load_dialect_impl = _pg_uuid_load_dialect_impl
PG_UUID.process_bind_param = _pg_uuid_process_bind_param
PG_UUID.process_result_value = _pg_uuid_process_result_value

# ---------------------------------------------------------------------------
# 3. Import only the stories module (avoids running agents/scrapers __init__)
# ---------------------------------------------------------------------------
from app.db.database import Base, get_db  # noqa: E402
from tests.router_loader import _load_router  # noqa: E402

stories_router = _load_router("app/api/stories.py", "saransh_test_stories")
waitlist_router = _load_router("app/api/waitlist.py", "saransh_test_waitlist")

# ---------------------------------------------------------------------------
# 4. Build a minimal test FastAPI app with only the stories router
# ---------------------------------------------------------------------------
test_app = FastAPI()
test_app.include_router(stories_router, prefix="/api")
test_app.include_router(waitlist_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# 5. Create a single in-memory SQLite engine for the whole test session
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once per test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """Return a transactional database session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):  # noqa: ANN001
        if trans.nested and not trans._parent.nested:  # type: ignore[attr-defined]
            connection.begin_nested()

    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session) -> Generator:
    """Return a TestClient that uses the test database session."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_app.dependency_overrides[get_db] = override_get_db
    with TestClient(test_app) as test_client:
        yield test_client
    test_app.dependency_overrides.clear()
