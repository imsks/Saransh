"""Onboarding questions, shared with Rajniti through the `users` table.

A question is asked only while its column is NULL, so anything a User already
answered in either product is never asked again.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Sequence, Union

from app.db.models import User

Answer = Union[str, Sequence[str]]

# Option values match Rajniti's onboarding steps exactly.
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


@dataclass(frozen=True)
class Question:
    key: str
    label: str
    kind: Literal["single", "multi", "text"]
    required: bool
    options: tuple[str, ...] = ()


QUESTIONS = (
    Question(
        "political_ideology",
        "Political inclination",
        "single",
        True,
        ("Rightist", "Leftist", "Communist", "Centrist", "Libertarian", "Neutral"),
    ),
    Question("state", "State", "single", True, INDIAN_STATES),
    Question(
        "age_group",
        "Age group",
        "single",
        True,
        ("18-25", "26-35", "36-50", "51-65", "65+"),
    ),
    Question("city", "City", "text", False),
    Question("phone", "Phone", "text", False),
    Question(
        "preferred_parties",
        "Parties you follow",
        "multi",
        False,
        (
            "Bharatiya Janata Party",
            "Indian National Congress",
            "Aam Aadmi Party",
            "Trinamool Congress",
            "Dravida Munnetra Kazhagam",
            "Shiv Sena",
            "Nationalist Congress Party",
            "Communist Party of India (Marxist)",
            "Bahujan Samaj Party",
            "Others",
        ),
    ),
    Question(
        "topics_of_interest",
        "Topics of interest",
        "multi",
        False,
        (
            "Economy",
            "Healthcare",
            "Education",
            "Infrastructure",
            "Agriculture",
            "Environment",
            "Technology",
            "Social Justice",
            "Employment",
            "National Security",
        ),
    ),
)

# What Rajniti needs before it treats its own onboarding as done.
RAJNITI_REQUIRED = ("political_ideology", "state", "age_group", "username")

TEXT_MAX_LENGTH = 100


def missing_questions(user: User) -> list[Question]:
    return [q for q in QUESTIONS if getattr(user, q.key) is None]


def _clean(question: Question, value: Answer | None) -> str | list[str]:
    if question.kind == "multi":
        values = list(value or [])
        if isinstance(value, str) or not set(values) <= set(question.options):
            raise ValueError(f"{question.key}: choose from the listed options")
        if question.required and not values:
            raise ValueError(f"{question.key} is required")
        return values

    if value is not None and not isinstance(value, str):
        raise ValueError(f"{question.key} must be a single value")
    text = (value or "").strip()
    if question.required and not text:
        raise ValueError(f"{question.key} is required")
    if question.kind == "single" and text and text not in question.options:
        raise ValueError(f"{question.key}: choose from the listed options")
    if len(text) > TEXT_MAX_LENGTH:
        raise ValueError(f"{question.key} is too long")
    return text


def apply_answers(user: User, answers: dict[str, Answer]) -> None:
    """Fill the User's unanswered questions; raises ValueError on an invalid answer.

    Answers to questions the User already answered are ignored, never overwritten.
    """
    cleaned = {q.key: _clean(q, answers.get(q.key)) for q in missing_questions(user)}
    for key, value in cleaned.items():
        setattr(user, key, value)
    if all(getattr(user, key) is not None for key in RAJNITI_REQUIRED):
        user.onboarding_completed = True
