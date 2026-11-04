"""Persistence helpers for a User's Saransh preferences."""

from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import UserPreferences
from app.onboarding import OnboardingAnswers


def get_preferences(db: Session, user_id: str) -> Optional[UserPreferences]:
    return db.get(UserPreferences, user_id)


def get_or_create(db: Session, user_id: str, default_name: str) -> UserPreferences:
    """Return the User's row, creating it empty on first use.

    A concurrent first request may insert the row between our read and our insert;
    the loser's insert is rolled back to a savepoint and the winner's row is returned.
    """
    preferences = db.get(UserPreferences, user_id)
    if preferences is not None:
        return preferences
    try:
        with db.begin_nested():
            preferences = UserPreferences(
                user_id=user_id,
                display_name=default_name,
                topics=[],
                coming_soon_interests=[],
                onboarding_completed=False,
            )
            db.add(preferences)
    except IntegrityError:
        preferences = db.get(UserPreferences, user_id)
        if preferences is None:
            raise
    return preferences


def save_onboarding(
    db: Session, user_id: str, default_name: str, answers: OnboardingAnswers
) -> UserPreferences:
    """Save the first submission and set Saransh's own flag; commits once."""
    preferences = get_or_create(db, user_id, default_name)
    # Hold the row lock through the commit so concurrent submissions serialise.
    db.refresh(preferences, with_for_update=True)
    preferences.display_name = answers.display_name
    preferences.state = answers.state
    preferences.topics = list(answers.topics)
    preferences.coming_soon_interests = list(answers.coming_soon_interests)
    preferences.onboarding_completed = True
    db.commit()
    return preferences
