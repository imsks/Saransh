"""Tests for the story ingestion (POST), list (GET), and detail (GET) endpoints."""

import uuid

STORIES_URL = "/api/stories"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_API_KEY = "test-api-key"
VALID_HEADERS = {"X-API-Key": VALID_API_KEY}

VALID_PAYLOAD = {
    "title_en": "Nagpur Metro announces new route",
    "title_hi": "नागपुर मेट्रो ने नए मार्ग की घोषणा की",
    "summary_en": "Nagpur Metro has announced a new route connecting the airport to the city centre.",
    "summary_hi": "नागपुर मेट्रो ने शहर के केंद्र को हवाई अड्डे से जोड़ने वाले नए मार्ग की घोषणा की है।",
    "category": "transport",
    "state": "Maharashtra",
    "district": "Nagpur",
    "sources": [
        {
            "outlet": "Example News",
            "url": "https://example.com/article",
            "source_type": "news",
        }
    ],
}


# ---------------------------------------------------------------------------
# POST /api/stories – happy-path
# ---------------------------------------------------------------------------


def test_ingest_story_returns_201(client):
    """A valid payload should return HTTP 201 with the created story."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    assert response.status_code == 201


def test_ingest_story_response_fields(client):
    """The response should contain all expected top-level fields."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    data = response.json()
    assert data["title_en"] == VALID_PAYLOAD["title_en"]
    assert data["title_hi"] == VALID_PAYLOAD["title_hi"]
    assert data["summary_en"] == VALID_PAYLOAD["summary_en"]
    assert data["summary_hi"] == VALID_PAYLOAD["summary_hi"]
    assert data["category"] == VALID_PAYLOAD["category"]
    assert data["state"] == VALID_PAYLOAD["state"]
    assert data["district"] == VALID_PAYLOAD["district"]


def test_ingest_story_default_status_is_draft(client):
    """Newly ingested stories should default to 'draft'."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    assert response.json()["status"] == "draft"


def test_ingest_story_sources_saved(client):
    """All provided sources should appear in the response."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    sources = response.json()["sources"]
    assert len(sources) == 1
    assert sources[0]["outlet"] == "Example News"
    # The URL is normalized by Pydantic's HttpUrl; compare the exact expected URL
    assert sources[0]["url"] == "https://example.com/article"
    assert sources[0]["source_type"] == "news"


def test_ingest_story_has_id_and_created_at(client):
    """Response should include a UUID id and created_at timestamp."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    data = response.json()
    assert "id" in data
    assert "created_at" in data


def test_ingest_story_optional_geo_fields_can_be_omitted(client):
    """state and district are optional; omitting them should still succeed."""
    payload = {**VALID_PAYLOAD, "state": None, "district": None}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 201
    data = response.json()
    assert data["state"] is None
    assert data["district"] is None


def test_ingest_story_multiple_sources(client):
    """Multiple sources should all be persisted."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [
            {
                "outlet": "Source A",
                "url": "https://source-a.com/1",
                "source_type": "news",
            },
            {
                "outlet": "Source B",
                "url": "https://source-b.com/2",
                "source_type": "blog",
            },
        ],
    }
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 201
    assert len(response.json()["sources"]) == 2


# ---------------------------------------------------------------------------
# POST /api/stories – validation failures → 422
# ---------------------------------------------------------------------------


def test_missing_title_en_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "title_en"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_title_hi_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "title_hi"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_summary_en_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary_en"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_summary_hi_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary_hi"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_category_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "category"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_empty_sources_list_returns_422(client):
    """An empty sources list must be rejected."""
    payload = {**VALID_PAYLOAD, "sources": []}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_sources_field_returns_422(client):
    """Omitting sources entirely must be rejected."""
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "sources"}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_invalid_source_url_returns_422(client):
    """A source with an invalid URL must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [
            {"outlet": "Bad Source", "url": "not-a-valid-url", "source_type": "news"}
        ],
    }
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_blank_title_en_returns_422(client):
    """A blank (whitespace-only) title_en must be rejected."""
    payload = {**VALID_PAYLOAD, "title_en": "   "}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_blank_title_hi_returns_422(client):
    """A blank title_hi must be rejected."""
    payload = {**VALID_PAYLOAD, "title_hi": ""}
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_source_outlet_returns_422(client):
    """A source missing the outlet field must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [{"url": "https://example.com/article"}],
    }
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


def test_missing_source_url_returns_422(client):
    """A source missing the url field must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [{"outlet": "Some Outlet"}],
    }
    response = client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/stories – API key authentication
# ---------------------------------------------------------------------------


def test_post_without_api_key_returns_401(client):
    """POST without X-API-Key header should return 401."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
    assert response.status_code == 401


def test_post_with_invalid_api_key_returns_401(client):
    """POST with a wrong X-API-Key should return 401."""
    response = client.post(
        STORIES_URL, json=VALID_PAYLOAD, headers={"X-API-Key": "wrong-key"}
    )
    assert response.status_code == 401


def test_post_with_valid_api_key_returns_201(client):
    """POST with the correct X-API-Key should return 201."""
    response = client.post(
        STORIES_URL, json=VALID_PAYLOAD, headers={"X-API-Key": VALID_API_KEY}
    )
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# GET /api/stories – story list
# ---------------------------------------------------------------------------


def test_list_stories_returns_200(client):
    """GET /api/stories should return HTTP 200."""
    response = client.get(STORIES_URL)
    assert response.status_code == 200


def test_list_stories_returns_list(client):
    """GET /api/stories should return a JSON array."""
    response = client.get(STORIES_URL)
    assert isinstance(response.json(), list)


def test_list_stories_includes_ingested_story(client):
    """A story ingested via POST should appear in the list."""
    client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    response = client.get(STORIES_URL)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_list_stories_response_fields(client):
    """Each story in the list should contain expected fields including sources."""
    client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    data = client.get(STORIES_URL).json()
    story = data[0]
    for field in (
        "id",
        "title_en",
        "title_hi",
        "summary_en",
        "summary_hi",
        "category",
        "status",
        "sources",
        "created_at",
    ):
        assert field in story


def test_list_stories_filter_by_category(client):
    """Filter by category should return only matching stories."""
    payload = {**VALID_PAYLOAD, "category": "unique-category-filter"}
    client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    response = client.get(f"{STORIES_URL}?category=unique-category-filter")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["category"] == "unique-category-filter" for s in data)


def test_list_stories_filter_by_state(client):
    """Filter by state should return only matching stories."""
    payload = {**VALID_PAYLOAD, "state": "FilterState"}
    client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    response = client.get(f"{STORIES_URL}?state=FilterState")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["state"] == "FilterState" for s in data)


def test_list_stories_filter_by_district(client):
    """Filter by district should return only matching stories."""
    payload = {**VALID_PAYLOAD, "district": "FilterDistrict"}
    client.post(STORIES_URL, json=payload, headers=VALID_HEADERS)
    response = client.get(f"{STORIES_URL}?district=FilterDistrict")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["district"] == "FilterDistrict" for s in data)


def test_list_stories_filter_by_status(client):
    """Filter by status=draft should return only draft stories."""
    client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    response = client.get(f"{STORIES_URL}?status=draft")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["status"] == "draft" for s in data)


def test_list_stories_filter_excludes_non_matching(client):
    """A filter that matches nothing should return an empty list."""
    response = client.get(f"{STORIES_URL}?category=nonexistent-xyz")
    assert response.status_code == 200
    assert response.json() == []


def test_list_stories_pagination_limit(client):
    """limit parameter should cap the number of returned stories."""
    for _ in range(3):
        client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    response = client.get(f"{STORIES_URL}?limit=2")
    assert response.status_code == 200
    assert len(response.json()) <= 2


def test_list_stories_pagination_offset(client):
    """offset beyond the total count should return an empty list."""
    for _ in range(2):
        client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    total = len(client.get(f"{STORIES_URL}?limit=100").json())
    response = client.get(f"{STORIES_URL}?offset={total}")
    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# GET /api/stories/{story_id} – story detail
# ---------------------------------------------------------------------------


def test_get_story_returns_200(client):
    """GET /api/stories/{id} should return HTTP 200 for an existing story."""
    post_resp = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    story_id = post_resp.json()["id"]
    response = client.get(f"{STORIES_URL}/{story_id}")
    assert response.status_code == 200


def test_get_story_response_fields(client):
    """GET /api/stories/{id} should return the correct story with sources."""
    post_resp = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    posted = post_resp.json()
    story_id = posted["id"]
    data = client.get(f"{STORIES_URL}/{story_id}").json()
    assert data["id"] == story_id
    assert data["title_en"] == VALID_PAYLOAD["title_en"]
    assert data["title_hi"] == VALID_PAYLOAD["title_hi"]
    assert data["summary_en"] == VALID_PAYLOAD["summary_en"]
    assert data["summary_hi"] == VALID_PAYLOAD["summary_hi"]
    assert data["category"] == VALID_PAYLOAD["category"]
    assert isinstance(data["sources"], list)
    assert len(data["sources"]) == 1


def test_get_story_404_for_unknown_id(client):
    """GET /api/stories/{id} should return 404 for a non-existent story."""
    fake_id = str(uuid.uuid4())
    response = client.get(f"{STORIES_URL}/{fake_id}")
    assert response.status_code == 404


def test_get_story_is_public(client):
    """GET /api/stories/{id} should be accessible without an API key."""
    post_resp = client.post(STORIES_URL, json=VALID_PAYLOAD, headers=VALID_HEADERS)
    story_id = post_resp.json()["id"]
    # Deliberately no X-API-Key header
    response = client.get(f"{STORIES_URL}/{story_id}")
    assert response.status_code == 200


def test_list_stories_is_public(client):
    """GET /api/stories should be accessible without an API key."""
    response = client.get(STORIES_URL)
    assert response.status_code == 200
