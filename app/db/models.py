import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
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


class Waitlist(CreatedAtMixin, Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(SharedBase):
    """Rajniti owns this table; Saransh maps only the columns it touches.

    Saransh inserts the row at a first sign-in and refreshes name and picture. `state`
    is read-only, to pre-select Saransh's State. `onboarding_completed` is Rajniti's
    flag: Saransh sets it False on insert and never reads or changes it again.
    """

    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Google `sub`
    email = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    state = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)


class UserPreferences(CreatedAtMixin, Base):
    """What a User told Saransh. Saransh owns this table; the row is created lazily."""

    __tablename__ = "saransh_user_preferences"

    # The column object, not "users.id": `users` lives on SharedBase's metadata.
    user_id = Column(
        String,
        ForeignKey(User.__table__.c.id, ondelete="CASCADE"),
        primary_key=True,
    )
    display_name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    topics = Column(JSON, nullable=False, default=list)
    coming_soon_interests = Column(JSON, nullable=False, default=list)
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
