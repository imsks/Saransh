import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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
    title_hi = Column(Text, nullable=False)
    summary_en = Column(Text, nullable=False)
    summary_hi = Column(Text, nullable=False)

    # Cover photo shown with the Story. Required — every Story has an image.
    image_url = Column(Text, nullable=False)

    category = Column(String(50), nullable=False)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)

    status = Column(String(20), nullable=False, default=STATUS_PUBLISHED)
    published_at = Column(DateTime(timezone=True), nullable=True)

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    sources = relationship(
        "Source",
        back_populates="story",
        cascade="all, delete-orphan",
    )


class Source(CreatedAtMixin, Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    story_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    outlet = Column(String(150), nullable=False)
    url = Column(Text, nullable=False)
    source_type = Column(String(30), nullable=True)

    story = relationship("Story", back_populates="sources")

    __table_args__ = (
        UniqueConstraint("story_id", "url", name="uq_story_source_url"),
    )


class Waitlist(CreatedAtMixin, Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
