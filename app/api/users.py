"""The signed-in User: sync at Google sign-in, read, and answer onboarding.

Everything lives on the shared `users` row; Saransh has no table of its own.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_internal_key
from app.db.database import get_db
from app.db.models import User
from app.onboarding import OnboardingAnswers, missing_fields

router = APIRouter(tags=["Users"])

ONBOARDED_FROM_SARANSH = "saransh"


class SyncIn(BaseModel):
    id: str = Field(min_length=1)
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None


class MeOut(BaseModel):
    id: str
    email: str
    picture: Optional[str]
    name: Optional[str]
    state: Optional[str]
    topics: List[str]
    coming_soon_interests: List[str]
    onboarded_from: str
    # What onboarding still has to ask, in form order: "name", "state", "topics".
    missing_fields: List[str]
    onboarded: bool


class SyncOut(MeOut):
    created: bool


class OnboardingIn(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    topics: List[str] = []
    coming_soon_interests: List[str] = []


def _missing(user: User) -> List[str]:
    return missing_fields(user.name, user.state, user.saransh_onboarded_at is not None)


def _me(user: User) -> MeOut:
    missing = _missing(user)
    return MeOut(
        id=user.id,
        email=user.email,
        picture=user.profile_picture,
        name=user.name,
        state=user.state,
        topics=user.saransh_topics or [],
        coming_soon_interests=user.saransh_interests or [],
        onboarded_from=user.onboarded_from,
        missing_fields=missing,
        onboarded=not missing,
    )


@router.post(
    "/users/sync",
    response_model=SyncOut,
    dependencies=[Depends(require_internal_key)],
)
def sync_user(payload: SyncIn, db: Session = Depends(get_db)):
    """Create the User at first Google sign-in, or refresh their name and picture."""
    user = db.get(User, payload.id)
    created = user is None
    if user is None:
        user = User(
            id=payload.id,
            email=payload.email,
            onboarding_completed=False,
            onboarded_from=ONBOARDED_FROM_SARANSH,
        )
        db.add(user)
    user.name = payload.name or user.name
    user.profile_picture = payload.picture or user.profile_picture
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # Two first sign-ins for one Google account race to insert; the loser
        # reloads the winner's row. No row under this id means the email is taken.
        user = db.get(User, payload.id) if created else None
        if user is None:
            raise HTTPException(
                status_code=409, detail="Email belongs to another account"
            ) from exc
        created = False
        user.name = payload.name or user.name
        user.profile_picture = payload.picture or user.profile_picture
        db.commit()
    return SyncOut(**_me(user).model_dump(), created=created)


@router.get("/me", response_model=MeOut)
def read_me(user: User = Depends(get_current_user)):
    return _me(user)


@router.put("/me/onboarding", response_model=MeOut)
def submit_onboarding(
    payload: OnboardingIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fill only what the row is missing; values already on it are never replaced."""
    # Hold the row lock through the commit so concurrent submissions serialise.
    db.refresh(user, with_for_update=True)
    missing = _missing(user)
    try:
        answers = OnboardingAnswers.validate(payload.model_dump(), asked=missing)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if answers.name is not None:
        user.name = answers.name
    if answers.state is not None:
        user.state = answers.state
    if user.saransh_onboarded_at is None:
        user.saransh_topics = list(answers.topics)
        user.saransh_interests = list(answers.coming_soon_interests)
        user.saransh_onboarded_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return _me(user)
