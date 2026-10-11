import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Waitlist
from app.utils import get_logger

router = APIRouter(tags=["Waitlist"])
logger = get_logger(__name__)

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class WaitlistIn(BaseModel):
    name: str
    email: EmailStr

    @field_validator("name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("field must not be blank")
        return trimmed

    @field_validator("name")
    @classmethod
    def name_length(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("name must be at least 2 characters")
        return value


class WaitlistOut(BaseModel):
    ok: bool
    # Opaque public identifier of the Signup — stable across repeat signups.
    signup_token: str
    duplicate: bool = False


@router.post("/waitlist")
def join_waitlist(payload: WaitlistIn, db: Session = Depends(get_db)):
    """Add an email to the Saransh launch waitlist."""
    normalized_email = payload.email.strip().lower()

    if not EMAIL_PATTERN.match(normalized_email):
        raise HTTPException(
            status_code=400, detail="Please enter a valid email address."
        )

    entry = Waitlist(
        name=payload.name.strip(),
        email=normalized_email,
    )

    try:
        db.add(entry)
        db.commit()
        return JSONResponse(
            status_code=201,
            content={"ok": True, "signup_token": str(entry.signup_token)},
        )
    except IntegrityError:
        db.rollback()
        # The email is already on the list: the same person, so hand back the
        # Token the first signup was given rather than minting a new one.
        existing = (
            db.query(Waitlist).filter(Waitlist.email == normalized_email).one_or_none()
        )
        if existing is None:
            logger.exception("waitlist.duplicate_lookup_failed")
            raise HTTPException(
                status_code=500,
                detail="Unable to save your waitlist signup right now.",
            )
        return JSONResponse(
            status_code=200,
            content={
                "ok": True,
                "duplicate": True,
                "signup_token": str(existing.signup_token),
            },
        )
    except Exception as exc:
        db.rollback()
        logger.exception("waitlist.signup_failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to save your waitlist signup right now.",
        ) from exc
