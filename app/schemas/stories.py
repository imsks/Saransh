"""Request and response schemas for Stories."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl, field_validator


class StoryIn(BaseModel):
    title_en: str
    summary_en: str
    image_url: HttpUrl
    source_url: Optional[HttpUrl] = None
    source_label: Optional[str] = None
    category: str
    state: Optional[str] = None

    @field_validator("title_en", "summary_en", "category")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("field must not be blank")
        return v


class StoryOut(BaseModel):
    id: UUID
    title_en: str
    summary_en: str
    image_url: str
    source_url: Optional[str]
    source_label: Optional[str]
    category: str
    state: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
