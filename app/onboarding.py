"""What Saransh asks a User once, right after sign-in.

Pure rules, no database. Name and State are required; up to three live Topics are
optional; Entertainment and Sports are coming-soon interests only. Nothing is
pre-set, and nothing here touches Rajniti's `users` columns.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
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


@dataclass(frozen=True)
class OnboardingAnswers:
    display_name: str
    state: str
    topics: tuple[str, ...]
    coming_soon_interests: tuple[str, ...]

    @classmethod
    def validate(cls, payload: Mapping[str, Any]) -> "OnboardingAnswers":
        """Raise ValueError on the first invalid answer."""
        name = payload.get("display_name")
        name = name.strip() if isinstance(name, str) else ""
        if not name:
            raise ValueError("display_name is required")
        if len(name) > NAME_MAX_LENGTH:
            raise ValueError("display_name is too long")

        state = payload.get("state")
        if state not in INDIAN_STATES:
            raise ValueError("state is required: choose from the listed options")

        topics = _choices(payload, "topics", LIVE_TOPICS)
        if len(topics) > MAX_TOPICS:
            raise ValueError(f"choose at most {MAX_TOPICS} topics")
        interests = _choices(payload, "coming_soon_interests", COMING_SOON_INTERESTS)

        return cls(name, state, tuple(topics), tuple(interests))


def rajniti_state(value: str | None) -> str | None:
    """Rajniti's state, only when it exactly matches a State Saransh offers."""
    return value if value in INDIAN_STATES else None
