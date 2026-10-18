"""Shared FastAPI dependencies for the API layer."""

import secrets
from typing import Optional

from fastapi import Depends, Header, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.db.models import User

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _check_key(provided: Optional[str], expected: Optional[str]) -> None:
    if not expected or not provided or not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def require_api_key(api_key: Optional[str] = Security(api_key_header)) -> None:
    """Guard write endpoints with the X-API-Key header."""
    _check_key(api_key, settings.SARANSH_INGEST_API_KEY)


def require_internal_key(api_key: Optional[str] = Security(api_key_header)) -> None:
    """Guard endpoints only the Next.js server may call."""
    _check_key(api_key, settings.SARANSH_INTERNAL_API_KEY)


def get_current_user(
    _: None = Depends(require_internal_key),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """The acting User, from the id the trusted server vouches for; never a body field."""
    user = db.get(User, x_user_id) if x_user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user
