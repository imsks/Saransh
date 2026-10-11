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
