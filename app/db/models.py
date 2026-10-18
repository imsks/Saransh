import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base

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


class Waitlist(CreatedAtMixin, Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    """Rajniti owns this table; Saransh maps only the columns it reads or fills."""

    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Google `sub`
    email = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    username = Column(String, nullable=True, unique=True)
    profile_picture = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    age_group = Column(String, nullable=True)
    political_ideology = Column(String, nullable=True)
    preferred_parties = Column(JSON, nullable=True)
    topics_of_interest = Column(JSON, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)
