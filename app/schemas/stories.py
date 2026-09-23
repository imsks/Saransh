"""Request and response schemas for Stories and their Sources."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl, field_validator


class SourceIn(BaseModel):
    outlet: str
    url: HttpUrl
    source_type: Optional[str] = None


class StoryIn(BaseModel):
    title_en: str
    title_hi: str
    summary_en: str
    summary_hi: str
    image_url: HttpUrl
    category: str
    state: Optional[str] = None
    district: Optional[str] = None
    sources: List[SourceIn]

    @field_validator("title_en", "title_hi", "summary_en", "summary_hi", "category")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("field must not be blank")
        return v

    @field_validator("sources")
    @classmethod
    def sources_not_empty(cls, v: List[SourceIn]) -> List[SourceIn]:
        if not v:
            raise ValueError("at least one source is required")
        return v


class SourceOut(BaseModel):
    id: UUID
    outlet: str
    url: str
    source_type: Optional[str]

    model_config = {"from_attributes": True}


class StoryOut(BaseModel):
    id: UUID
    title_en: str
    title_hi: str
    summary_en: str
    summary_hi: str
    image_url: str
    category: str
    state: Optional[str]
    district: Optional[str]
    status: str
    sources: List[SourceOut]
    created_at: datetime

    model_config = {"from_attributes": True}
