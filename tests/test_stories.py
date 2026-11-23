"""Tests for the story ingestion (POST), list (GET), and detail (GET) endpoints."""

import uuid

import pytest

from app.db.models import Story

STORIES_URL = "/api/v1/stories"
VALID_HEADERS = {"X-API-Key": "test-api-key"}

VALID_PAYLOAD = {
    "title_en": "Nagpur Metro announces new route",
    "summary_en": "Nagpur Metro has announced a new route to the airport.",
    "image_url": "https://example.com/cover.jpg",
    "source_url": "https://example.com/article",
    "source_label": "Example News",
    "category": "civic",
    "tier": "state",
    "state": "Maharashtra",
}


def _ingest(client, **overrides):
    return client.post(
        STORIES_URL, json={**VALID_PAYLOAD, **overrides}, headers=VALID_HEADERS
    )


# ---------------------------------------------------------------------------
# POST /api/v1/stories
# ---------------------------------------------------------------------------


def test_ingest_story_returns_the_published_story(client):
    response = _ingest(client)

    assert response.status_code == 201
    data = response.json()
    for field, value in VALID_PAYLOAD.items():
        assert data[field] == value
    assert data["status"] == "published"
    assert uuid.UUID(data["id"])
    assert "created_at" in data


@pytest.mark.parametrize(
    "legacy",
    [
        {"title_hi": "शीर्षक"},
        {"summary_hi": "सारांश"},
        {"district": "Nagpur"},
        {"published_at": "2026-09-30T10:00:00+00:00"},
        {"sources": [{"outlet": "PTI", "url": "https://pti.example/1"}]},
    ],
)
def test_legacy_fields_in_the_payload_are_ignored(client, legacy):
    """A routine still sending dropped fields must not break ingest or leak them back."""
    response = _ingest(client, **legacy)

    assert response.status_code == 201
    assert not set(legacy) & set(response.json())


@pytest.mark.parametrize("tier", ["national", "international"])
def test_non_state_story_has_no_state(client, tier):
    response = _ingest(client, tier=tier, state=None)
    assert response.status_code == 201
    assert response.json()["tier"] == tier
    assert response.json()["state"] is None


@pytest.mark.parametrize(
    "field",
    [
        "title_en",
        "summary_en",
        "image_url",
        "source_url",
        "source_label",
        "category",
        "tier",
    ],
)
def test_missing_required_field_returns_422(client, field):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != field}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "override",
    [
        {"title_en": "   "},
        {"summary_en": ""},
        {"image_url": "not-a-valid-url"},
        {"source_url": "not-a-valid-url"},
        {"source_url": ""},
        {"source_url": None},
        {"source_label": None},
        {"source_label": "   "},
        {"tier": "city"},
        {"category": "entertainment"},
        {"category": "sports"},
        {"category": "transport"},
        {"state": None},
        {"state": "Not a state"},
        {"tier": "national", "state": "Maharashtra"},
        {"tier": "international", "state": "Maharashtra"},
        {"tier": "national", "state": ""},
    ],
)
def test_invalid_field_returns_422(client, override):
    response = _ingest(client, **override)
    assert response.status_code == 422
    assert response.json()["detail"]


@pytest.mark.parametrize(
    "summary, status",
    [
        (" ".join(["word"] * 60), 201),
        (" ".join(["word"] * 61), 422),
        (" ".join(["word"] * 60 + ["...", "—"]), 201),
        ("x" * 400, 201),
        ("x" * 401, 422),
        ("  " + "x" * 400 + "  ", 201),
    ],
)
def test_summary_limits(client, summary, status):
    response = _ingest(client, summary_en=summary)
    assert response.status_code == status
    if status == 422:
        assert "summary" in str(response.json()["detail"]).lower()


@pytest.mark.parametrize(
    "headline, status",
    [
        ("", 422),
        ("   ", 422),
        ("x" * 70, 201),
        ("x" * 71, 422),
        ("  " + "x" * 70 + "  ", 201),
    ],
)
def test_headline_limits(client, headline, status):
    assert _ingest(client, title_en=headline).status_code == status


@pytest.mark.parametrize("headers", [{}, {"X-API-Key": "wrong-key"}])
def test_post_without_a_valid_api_key_returns_401(client, headers):
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=headers)
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/v1/stories
# ---------------------------------------------------------------------------


def test_list_stories_is_public_and_includes_ingested_story(client):
    _ingest(client)
    response = client.get(STORIES_URL)

    assert response.status_code == 200
    assert response.json()[0]["title_en"] == VALID_PAYLOAD["title_en"]


@pytest.mark.parametrize(
    "field, value",
    [("category", "civic"), ("state", "Maharashtra")],
)
def test_list_stories_filters(client, field, value):
    _ingest(client, **{field: value})
    data = client.get(f"{STORIES_URL}?{field}={value}").json()

    assert len(data) >= 1
    assert all(s[field] == value for s in data)


def test_list_stories_only_returns_published(client, db_session):
    _ingest(client)
    draft = Story(
        title_en="Unpublished draft",
        summary_en="Should never be public.",
        image_url="https://example.com/draft.jpg",
        category="transport",
        status="draft",
    )
    db_session.add(draft)
    db_session.commit()

    for query in ("", "?status=draft"):
        data = client.get(f"{STORIES_URL}{query}").json()
        assert data
        assert all(s["status"] == "published" for s in data)
        assert "Unpublished draft" not in [s["title_en"] for s in data]


def test_list_stories_filter_excludes_non_matching(client):
    assert client.get(f"{STORIES_URL}?category=nonexistent-xyz").json() == []


def test_list_stories_paginates(client):
    for _ in range(3):
        _ingest(client)
    total = len(client.get(f"{STORIES_URL}?limit=100").json())

    assert len(client.get(f"{STORIES_URL}?limit=2").json()) == 2
    assert client.get(f"{STORIES_URL}?offset={total}").json() == []


# ---------------------------------------------------------------------------
# GET /api/v1/stories/{story_id}
# ---------------------------------------------------------------------------


def test_get_story_is_public(client):
    story_id = _ingest(client).json()["id"]
    response = client.get(f"{STORIES_URL}/{story_id}")

    assert response.status_code == 200
    assert response.json()["id"] == story_id


def test_legacy_story_without_tier_still_lists_and_opens(client, db_session):
    story = Story(
        title_en="Legacy story",
        summary_en="Stored before tier was added.",
        image_url="https://example.com/legacy.jpg",
        category="transport",
    )
    db_session.add(story)
    db_session.commit()

    listed = client.get(STORIES_URL).json()
    assert any(item["id"] == str(story.id) and item["tier"] is None for item in listed)

    detail = client.get(f"{STORIES_URL}/{story.id}")
    assert detail.status_code == 200
    assert detail.json()["tier"] is None


def test_get_story_404_for_unknown_id(client):
    assert client.get(f"{STORIES_URL}/{uuid.uuid4()}").status_code == 404


def test_get_story_404_for_unpublished_story(client, db_session):
    draft = Story(
        title_en="Unpublished draft",
        summary_en="Should never be public.",
        image_url="https://example.com/draft.jpg",
        category="transport",
        status="draft",
    )
    db_session.add(draft)
    db_session.commit()
    assert client.get(f"{STORIES_URL}/{draft.id}").status_code == 404


def test_unversioned_path_is_not_served(client):
    """There is exactly one surface: /api/v1."""
    assert client.get("/api/stories").status_code == 404
