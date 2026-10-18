"""Tests for the story ingestion (POST), list (GET), and detail (GET) endpoints."""

import uuid

import pytest

STORIES_URL = "/api/v1/stories"
VALID_HEADERS = {"X-API-Key": "test-api-key"}

VALID_PAYLOAD = {
    "title_en": "Nagpur Metro announces new route",
    "summary_en": "Nagpur Metro has announced a new route to the airport.",
    "image_url": "https://example.com/cover.jpg",
    "source_url": "https://example.com/article",
    "source_label": "Example News",
    "category": "transport",
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


@pytest.mark.parametrize("field", ["source_url", "source_label", "state"])
def test_optional_fields_can_be_null(client, field):
    response = _ingest(client, **{field: None})

    assert response.status_code == 201
    assert response.json()[field] is None


@pytest.mark.parametrize("field", ["title_en", "summary_en", "image_url", "category"])
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
    ],
)
def test_invalid_field_returns_422(client, override):
    assert _ingest(client, **override).status_code == 422


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
    [("category", "unique-category"), ("state", "FilterState")],
)
def test_list_stories_filters(client, field, value):
    _ingest(client, **{field: value})
    data = client.get(f"{STORIES_URL}?{field}={value}").json()

    assert len(data) >= 1
    assert all(s[field] == value for s in data)


def test_list_stories_filter_by_status(client):
    _ingest(client)
    data = client.get(f"{STORIES_URL}?status=published").json()

    assert len(data) >= 1
    assert all(s["status"] == "published" for s in data)


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


def test_get_story_404_for_unknown_id(client):
    assert client.get(f"{STORIES_URL}/{uuid.uuid4()}").status_code == 404


def test_unversioned_path_is_not_served(client):
    """There is exactly one surface: /api/v1."""
    assert client.get("/api/stories").status_code == 404
