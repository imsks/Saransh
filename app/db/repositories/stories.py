from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import STATUS_PUBLISHED, Story
from app.schemas.stories import StoryIn


def list_stories(
    db: Session,
    *,
    limit: int,
    offset: int,
    category: Optional[str] = None,
    state: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Story]:
    query = db.query(Story)
    for column, value in (
        (Story.category, category),
        (Story.state, state),
        (Story.status, status),
    ):
        if value is not None:
            query = query.filter(column == value)
    # id breaks created_at ties so offset paging stays stable.
    return (
        query.order_by(Story.created_at.desc(), Story.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_story(db: Session, story_id: UUID) -> Optional[Story]:
    return db.query(Story).filter(Story.id == story_id).first()


def create_story(db: Session, payload: StoryIn) -> Story:
    try:
        story = Story(
            title_en=payload.title_en,
            summary_en=payload.summary_en,
            image_url=str(payload.image_url),
            source_url=str(payload.source_url) if payload.source_url else None,
            source_label=payload.source_label,
            category=payload.category,
            tier=payload.tier,
            state=payload.state,
            status=STATUS_PUBLISHED,
        )
        db.add(story)
        db.commit()
        db.refresh(story)
        return story
    except Exception:
        db.rollback()
        raise
