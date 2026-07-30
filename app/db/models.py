import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Story(Base):
    __tablename__ = "stories"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Bilingual content
    title_en = Column(Text, nullable=False)
    title_hi = Column(Text, nullable=False)

    summary_en = Column(Text, nullable=False)
    summary_hi = Column(Text, nullable=False)

    # Classification
    category = Column(String(50), nullable=False)

    # Geography
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)

    image_url = Column(Text, nullable=True)

    # Publishing lifecycle
    status = Column(
        String(20),
        nullable=False,
        default="draft",
    )

    event_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    published_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

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


class Source(Base):
    __tablename__ = "sources"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    story_id = Column(
        UUID(as_uuid=True),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    outlet = Column(
        String(150),
        nullable=False,
    )

    url = Column(
        Text,
        nullable=False,
    )

    source_type = Column(
        String(30),
        nullable=True,
    )

    published_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    fetched_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    story = relationship(
        "Story",
        back_populates="sources",
    )

    __table_args__ = (
        UniqueConstraint(
            "story_id",
            "url",
            name="uq_story_source_url",
        ),
    )