"""Persistence helpers for Stories and their Sources."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import STATUS_DRAFT, Source, Story
from app.schemas.stories import StoryIn


def list_stories(
    db: Session,
    *,
    limit: int,
    offset: int,
    category: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Story]:
    """Return stories newest-first, filtered by any supplied criteria."""
    query = db.query(Story)
    if category is not None:
        query = query.filter(Story.category == category)
    if state is not None:
        query = query.filter(Story.state == state)
    if district is not None:
        query = query.filter(Story.district == district)
    if status is not None:
        query = query.filter(Story.status == status)
    return query.order_by(Story.created_at.desc()).offset(offset).limit(limit).all()


def get_story(db: Session, story_id: UUID) -> Optional[Story]:
    """Return a single story by ID, or None if it does not exist."""
    return db.query(Story).filter(Story.id == story_id).first()


def create_story(db: Session, payload: StoryIn) -> Story:
    """Persist a story and its sources as a draft, rolling back on failure."""
    try:
        story = Story(
            title_en=payload.title_en,
            title_hi=payload.title_hi,
            summary_en=payload.summary_en,
            summary_hi=payload.summary_hi,
            image_url=str(payload.image_url),
            category=payload.category,
            state=payload.state,
            district=payload.district,
            status=STATUS_DRAFT,
        )
        db.add(story)
        db.flush()  # obtain story.id before inserting sources

        for source_in in payload.sources:
            db.add(
                Source(
                    story_id=story.id,
                    outlet=source_in.outlet,
                    url=str(source_in.url),
                    source_type=source_in.source_type,
                )
            )

        db.commit()
        db.refresh(story)
        return story
    except Exception:
        db.rollback()
        raise
