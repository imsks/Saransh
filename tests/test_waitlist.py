"""Tests for POST /api/v1/waitlist."""

from __future__ import annotations

import uuid

import sqlalchemy as sa

from app.db.models import Waitlist

WAITLIST_URL = "/api/v1/waitlist"


def _payload(email: str | None = None) -> dict:
    return {
        "name": "Priya Sharma",
        "email": email or f"priya-{uuid.uuid4()}@example.com",
    }


def test_join_waitlist_returns_201(client):
    response = client.post(WAITLIST_URL, json=_payload())
    assert response.status_code == 201
    assert response.json() == {"ok": True}


def test_join_waitlist_duplicate_returns_200(client):
    payload = _payload()
    first = client.post(WAITLIST_URL, json=payload)
    second = client.post(WAITLIST_URL, json=payload)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json() == {"ok": True, "duplicate": True}


def test_join_waitlist_rejects_short_name(client):
    response = client.post(
        WAITLIST_URL,
        json={**_payload(), "name": "A"},
    )
    assert response.status_code == 422


def test_join_waitlist_rejects_invalid_email(client):
    response = client.post(
        WAITLIST_URL,
        json={**_payload(), "email": "not-an-email"},
    )
    assert response.status_code == 422


def test_join_waitlist_ignores_legacy_extra_fields(client, db_session):
    payload = {
        **_payload(),
        "language": "Hindi",
        "source": "GitHub",
    }
    response = client.post(
        WAITLIST_URL,
        json=payload,
    )
    assert response.status_code == 201
    assert response.json() == {"ok": True}

    row = db_session.query(Waitlist).filter_by(email=payload["email"]).one()
    assert row.name == payload["name"]
    assert row.email == payload["email"]

    column_names = {
        column["name"] for column in sa.inspect(db_session.bind).get_columns("waitlist")
    }
    assert "language" not in column_names
    assert "source" not in column_names
