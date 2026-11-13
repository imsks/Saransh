"""What Saransh asks a User once, right after sign-in.

Pure rules, no database. Saransh asks only for what the shared `users` row is
missing: a name and a State when absent (both required then), and its own Topics
once (up to three live Topics, optional; Entertainment and Sports are coming-soon
interests only). Anything already on the row is never asked for or overwritten.
"""

from __future__ import annotations

from collections.abc import Collection, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

# Matches how Rajniti stores `users.state`, so its value can pre-select ours.
INDIAN_STATES = (
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
)


LIVE_TOPICS = ("politics", "civic", "education", "business", "crime")
COMING_SOON_INTERESTS = ("entertainment", "sports")
MAX_TOPICS = 3
NAME_MAX_LENGTH = 100


def _choices(payload: Mapping[str, Any], key: str, allowed: Sequence[str]) -> list[str]:
    value = payload.get(key)
    if value is None:
        return []
    if isinstance(value, str) or not isinstance(value, Sequence):
        raise ValueError(f"{key} must be a list")
    if not set(value) <= set(allowed):
        raise ValueError(f"{key}: choose from the listed options")
    return list(dict.fromkeys(value))


FIELD_NAME = "name"
FIELD_STATE = "state"
FIELD_TOPICS = "topics"


def missing_fields(name: str | None, state: str | None, onboarded: bool) -> list[str]:
    """What Saransh still has to ask, in form order; empty once onboarded."""
    missing = []
    if not (name or "").strip():
        missing.append(FIELD_NAME)
    if state not in INDIAN_STATES:
        missing.append(FIELD_STATE)
    if not onboarded:
        missing.append(FIELD_TOPICS)
    return missing


@dataclass(frozen=True)
class OnboardingAnswers:
    """Only the answers to what was asked; `None` means "not asked, keep as is"."""

    name: str | None
    state: str | None
    topics: tuple[str, ...]
    coming_soon_interests: tuple[str, ...]

    @classmethod
    def validate(
        cls, payload: Mapping[str, Any], asked: Collection[str]
    ) -> "OnboardingAnswers":
        """Raise ValueError on the first invalid answer; ignore what was not asked."""
        name = None
        if FIELD_NAME in asked:
            name = payload.get("name")
            name = name.strip() if isinstance(name, str) else ""
            if not name:
                raise ValueError("name is required")
            if len(name) > NAME_MAX_LENGTH:
                raise ValueError("name is too long")

        state = None
        if FIELD_STATE in asked:
            state = payload.get("state")
            if state not in INDIAN_STATES:
                raise ValueError("state is required: choose from the listed options")

        topics: list[str] = []
        interests: list[str] = []
        if FIELD_TOPICS in asked:
            topics = _choices(payload, "topics", LIVE_TOPICS)
            if len(topics) > MAX_TOPICS:
                raise ValueError(f"choose at most {MAX_TOPICS} topics")
            interests = _choices(
                payload, "coming_soon_interests", COMING_SOON_INTERESTS
            )

        return cls(name, state, tuple(topics), tuple(interests))
