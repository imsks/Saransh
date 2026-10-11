from pathlib import Path


DOC = Path(__file__).resolve().parents[1] / "docs" / "story-ingest-routine.md"


def test_story_ingest_routine_matches_current_national_pivot():
    text = DOC.read_text()

    assert 'Regional' not in text
    assert 'Infrastructure' not in text
    assert 'district' not in text.lower()
    assert 'docs/specs/' not in text
    assert 'STOPGAP' in text
    assert 'politics | civic | education | crime | business' in text
    assert 'Entertainment' in text and 'Sports' in text
    assert 'National, State and India-relevant International' in text
    assert '"category": "politics"' in text
