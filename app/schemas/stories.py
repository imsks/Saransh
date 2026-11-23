"""Request and response schemas for Stories."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl, field_validator, model_validator

from app.onboarding import INDIAN_STATES, LIVE_TOPICS
from app.story_text import (
    HEADLINE_MAX_CHARACTERS,
    SUMMARY_MAX_CHARACTERS,
    SUMMARY_MAX_WORDS,
    word_count,
)

StoryTier = Literal["national", "state", "international"]


class StoryIn(BaseModel):
    title_en: str
    summary_en: str
    image_url: HttpUrl
    source_url: HttpUrl
    source_label: str
    category: str
    tier: StoryTier
    state: Optional[str] = None

    @field_validator("title_en", "summary_en", "source_label")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("field must not be blank")
        return v

    @field_validator("title_en")
    @classmethod
    def headline_length(cls, v: str) -> str:
        if len(v.strip()) > HEADLINE_MAX_CHARACTERS:
            raise ValueError(
                f"headline must be at most {HEADLINE_MAX_CHARACTERS} characters"
            )
        return v

    @field_validator("summary_en")
    @classmethod
    def summary_length(cls, v: str) -> str:
        if word_count(v) > SUMMARY_MAX_WORDS:
            raise ValueError(f"summary must be at most {SUMMARY_MAX_WORDS} words")
        if len(v.strip()) > SUMMARY_MAX_CHARACTERS:
            raise ValueError(
                f"summary must be at most {SUMMARY_MAX_CHARACTERS} characters"
            )
        return v

    @field_validator("category")
    @classmethod
    def live_category(cls, v: str) -> str:
        if v not in LIVE_TOPICS:
            raise ValueError("category must be a live topic")
        return v

    @model_validator(mode="after")
    def tier_state(self) -> "StoryIn":
        if self.tier == "state":
            if self.state not in INDIAN_STATES:
                raise ValueError("state tier requires a state from the listed options")
        elif self.state is not None:
            raise ValueError("state must be null for national or international tier")
        return self


class StoryOut(BaseModel):
    id: UUID
    title_en: str
    summary_en: str
    image_url: str
    source_url: Optional[str]
    source_label: Optional[str]
    category: str
    tier: Optional[StoryTier]
    state: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
