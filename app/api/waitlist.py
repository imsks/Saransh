import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Waitlist

router = APIRouter(tags=["Waitlist"])
logger = logging.getLogger(__name__)

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class WaitlistIn(BaseModel):
    name: str
    email: EmailStr
    language: str
    source: Optional[str] = None

    @field_validator("name", "language")
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

    @field_validator("source")
    @classmethod
    def normalize_source(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class WaitlistOut(BaseModel):
    ok: bool
    duplicate: bool = False


@router.post("/waitlist")
def join_waitlist(payload: WaitlistIn, db: Session = Depends(get_db)):
    """Add an email to the Saransh launch waitlist."""
    normalized_email = payload.email.strip().lower()

    if not EMAIL_PATTERN.match(normalized_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    entry = Waitlist(
        name=payload.name.strip(),
        email=normalized_email,
        language=payload.language.strip(),
        source=payload.source,
    )

    try:
        db.add(entry)
        db.commit()
        return JSONResponse(status_code=201, content={"ok": True})
    except IntegrityError:
        db.rollback()
        return JSONResponse(status_code=200, content={"ok": True, "duplicate": True})
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to save waitlist signup: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to save your waitlist signup right now.",
        ) from exc
