"""The signed-in User: sync at Google sign-in, read, and answer onboarding."""

from dataclasses import asdict
from typing import Dict, List, Literal, Optional, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_internal_key
from app.db.database import get_db
from app.db.models import User
from app.onboarding import apply_answers, missing_questions

router = APIRouter(tags=["Users"])


class SyncIn(BaseModel):
    id: str = Field(min_length=1)
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None


class QuestionOut(BaseModel):
    key: str
    label: str
    kind: Literal["single", "multi", "text"]
    required: bool
    options: List[str]


class MeOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    picture: Optional[str]
    onboarded: bool
    questions: List[QuestionOut]


class SyncOut(MeOut):
    created: bool


class OnboardingIn(BaseModel):
    answers: Dict[str, Union[str, List[str]]]


def _me(user: User) -> MeOut:
    questions = missing_questions(user)
    return MeOut(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.profile_picture,
        onboarded=not questions,
        questions=[QuestionOut(**asdict(q)) for q in questions],
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
        raise HTTPException(
            status_code=409, detail="Email belongs to another account"
        ) from exc
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
    try:
        apply_answers(user, payload.answers)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.commit()
    return _me(user)
