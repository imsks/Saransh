"""The signed-in User: sync at Google sign-in, read, and answer onboarding."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_internal_key
from app.db.database import get_db
from app.db.models import User
from app.db.repositories import preferences as preferences_repo
from app.onboarding import OnboardingAnswers, rajniti_state

router = APIRouter(tags=["Users"])


class SyncIn(BaseModel):
    id: str = Field(min_length=1)
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None


class MeOut(BaseModel):
    id: str
    email: str
    picture: Optional[str]
    # Saransh's own answers and flag; none of them live in Rajniti's `users`.
    display_name: str
    state: Optional[str]
    topics: List[str]
    coming_soon_interests: List[str]
    onboarded: bool
    # Rajniti's state, only when it exactly matches a State Saransh offers.
    rajniti_state: Optional[str]


class SyncOut(MeOut):
    created: bool


class OnboardingIn(BaseModel):
    display_name: str
    state: str
    topics: List[str] = []
    coming_soon_interests: List[str] = []


def _default_name(user: User) -> str:
    return user.name or user.email.split("@")[0]


def _me(db: Session, user: User) -> MeOut:
    preferences = preferences_repo.get_preferences(db, user.id)
    return MeOut(
        id=user.id,
        email=user.email,
        picture=user.profile_picture,
        display_name=preferences.display_name if preferences else _default_name(user),
        state=preferences.state if preferences else None,
        topics=preferences.topics if preferences else [],
        coming_soon_interests=preferences.coming_soon_interests if preferences else [],
        onboarded=bool(preferences and preferences.onboarding_completed),
        rajniti_state=rajniti_state(user.state),
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
        user = User(id=payload.id, email=payload.email, onboarding_completed=False)
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
    return SyncOut(**_me(db, user).model_dump(), created=created)


@router.get("/me", response_model=MeOut)
def read_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _me(db, user)


@router.put("/me/onboarding", response_model=MeOut)
def submit_onboarding(
    payload: OnboardingIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the first submission; only Saransh's own preferences are written."""
    try:
        answers = OnboardingAnswers.validate(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    preferences_repo.save_onboarding(db, user.id, _default_name(user), answers)
    return _me(db, user)
