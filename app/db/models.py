import uuid

from sqlalchemy import (
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
