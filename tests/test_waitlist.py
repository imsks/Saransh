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
    body = response.json()
    assert body["ok"] is True
    # A fresh Signup carries a Signup Token the Visitor can be matched by.
    assert uuid.UUID(body["signup_token"])


def test_join_waitlist_never_exposes_the_integer_key(client):
    response = client.post(WAITLIST_URL, json=_payload())
    assert response.status_code == 201
    assert "id" not in response.json()


def test_join_waitlist_duplicate_returns_the_same_token(client):
    payload = _payload()
    first = client.post(WAITLIST_URL, json=payload)
    second = client.post(WAITLIST_URL, json=payload)

    assert first.json()["signup_token"] == second.json()["signup_token"]
    assert "id" not in second.json()


def test_join_waitlist_token_ignores_casing_and_whitespace(client):
    email = f"priya-{uuid.uuid4()}@example.com"
    first = client.post(WAITLIST_URL, json={"name": "Priya Sharma", "email": email})
    second = client.post(
        WAITLIST_URL,
        json={"name": "  priya sharma  ", "email": f"  {email.upper()}  "},
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["duplicate"] is True
    assert second.json()["signup_token"] == first.json()["signup_token"]


def test_join_waitlist_duplicate_returns_200(client):
    payload = _payload()
    first = client.post(WAITLIST_URL, json=payload)
    second = client.post(WAITLIST_URL, json=payload)

    assert first.status_code == 201
    assert second.status_code == 200
    body = second.json()
    assert body["ok"] is True
    assert body["duplicate"] is True


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
    assert response.json()["ok"] is True

    row = db_session.query(Waitlist).filter_by(email=payload["email"]).one()
    assert row.name == payload["name"]
    assert row.email == payload["email"]

    column_names = {
        column["name"] for column in sa.inspect(db_session.bind).get_columns("waitlist")
    }
    assert "language" not in column_names
    assert "source" not in column_names
