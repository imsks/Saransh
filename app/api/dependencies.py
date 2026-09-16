"""Shared FastAPI dependencies for the API layer."""

import secrets
from typing import Optional

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(api_key: Optional[str] = Security(api_key_header)) -> None:
    """Guard write endpoints with the X-API-Key header."""
    expected = settings.SARANSH_INGEST_API_KEY
    if not expected or not api_key or not secrets.compare_digest(api_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
