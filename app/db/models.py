import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base, SharedBase

STATUS_PUBLISHED = "published"


class CreatedAtMixin:
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Story(CreatedAtMixin, Base):
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title_en = Column(Text, nullable=False)
    summary_en = Column(Text, nullable=False)
    image_url = Column(Text, nullable=False)
    source_url = Column(Text, nullable=True)
    source_label = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    state = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default=STATUS_PUBLISHED)

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(SharedBase):
    """One row per person, shared with Rajniti, which owns the table and its migrations.

    Saransh keeps everything it asks a User here, never in a table of its own. It
    inserts the row at a first sign-in (`onboarded_from="saransh"`), fills `name`
    and `state` only when they are missing, and owns the `saransh_*` columns.
    `onboarding_completed` is Rajniti's flag: Saransh never reads or changes it.
    """

    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Google `sub`
    email = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    state = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    # Which product acquired the User; written once, on insert.
    onboarded_from = Column(String, nullable=False, server_default="rajniti")
    saransh_topics = Column(JSON, nullable=True)
    saransh_interests = Column(JSON, nullable=True)
    saransh_onboarded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)
