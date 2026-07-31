"""Tests for the POST /api/stories story ingestion endpoint."""
import pytest

STORIES_URL = "/api/stories"

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
# Happy-path
# ---------------------------------------------------------------------------


def test_ingest_story_returns_201(client):
    """A valid payload should return HTTP 201 with the created story."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
    assert response.status_code == 201


def test_ingest_story_response_fields(client):
    """The response should contain all expected top-level fields."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
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
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
    assert response.json()["status"] == "draft"


def test_ingest_story_sources_saved(client):
    """All provided sources should appear in the response."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
    sources = response.json()["sources"]
    assert len(sources) == 1
    assert sources[0]["outlet"] == "Example News"
    # The URL is normalized by Pydantic's HttpUrl; compare the exact expected URL
    assert sources[0]["url"] == "https://example.com/article"
    assert sources[0]["source_type"] == "news"


def test_ingest_story_has_id_and_created_at(client):
    """Response should include a UUID id and created_at timestamp."""
    response = client.post(STORIES_URL, json=VALID_PAYLOAD)
    data = response.json()
    assert "id" in data
    assert "created_at" in data


def test_ingest_story_optional_geo_fields_can_be_omitted(client):
    """state and district are optional; omitting them should still succeed."""
    payload = {**VALID_PAYLOAD, "state": None, "district": None}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["state"] is None
    assert data["district"] is None


def test_ingest_story_multiple_sources(client):
    """Multiple sources should all be persisted."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [
            {"outlet": "Source A", "url": "https://source-a.com/1", "source_type": "news"},
            {"outlet": "Source B", "url": "https://source-b.com/2", "source_type": "blog"},
        ],
    }
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 201
    assert len(response.json()["sources"]) == 2


# ---------------------------------------------------------------------------
# Validation failures → 422
# ---------------------------------------------------------------------------


def test_missing_title_en_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "title_en"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_title_hi_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "title_hi"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_summary_en_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary_en"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_summary_hi_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "summary_hi"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_category_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "category"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_empty_sources_list_returns_422(client):
    """An empty sources list must be rejected."""
    payload = {**VALID_PAYLOAD, "sources": []}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_sources_field_returns_422(client):
    """Omitting sources entirely must be rejected."""
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "sources"}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_invalid_source_url_returns_422(client):
    """A source with an invalid URL must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [{"outlet": "Bad Source", "url": "not-a-valid-url", "source_type": "news"}],
    }
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_blank_title_en_returns_422(client):
    """A blank (whitespace-only) title_en must be rejected."""
    payload = {**VALID_PAYLOAD, "title_en": "   "}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_blank_title_hi_returns_422(client):
    """A blank title_hi must be rejected."""
    payload = {**VALID_PAYLOAD, "title_hi": ""}
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_source_outlet_returns_422(client):
    """A source missing the outlet field must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [{"url": "https://example.com/article"}],
    }
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422


def test_missing_source_url_returns_422(client):
    """A source missing the url field must be rejected."""
    payload = {
        **VALID_PAYLOAD,
        "sources": [{"outlet": "Some Outlet"}],
    }
    response = client.post(STORIES_URL, json=payload)
    assert response.status_code == 422
