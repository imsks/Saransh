from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_adr_0001_avoids_old_scraper_embedding_language():
    text = (ROOT / "docs" / "adr" / "0001-fastapi-backend.md").read_text()
    assert "embedding APIs" not in text
    assert "scraping news sources" not in text


def test_adr_0006_uses_state_not_district():
    text = (ROOT / "docs" / "adr" / "0006-shared-database-and-users.md").read_text()
    assert "district" not in text.lower()
    assert "state" in text.lower()


def test_story_ingest_routine_matches_current_national_pivot():
    text = (ROOT / "docs" / "story-ingest-routine.md").read_text()

    assert "Regional" not in text
    assert "Infrastructure" not in text
    assert "district" not in text.lower()
    assert "docs/specs/" not in text
    assert "STOPGAP" in text
    assert "politics | civic | education | crime | business" in text
    assert "Entertainment" in text and "Sports" in text
    assert "National, State and India-relevant International" in text
    assert '"category": "politics"' in text
