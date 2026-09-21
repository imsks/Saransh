"""Settings parsing contract."""

from __future__ import annotations

from app.config import DEFAULT_CORS_ORIGINS, parse_origins, settings


def test_parse_origins_single():
    assert parse_origins("http://localhost:3001") == ["http://localhost:3001"]


def test_parse_origins_multiple():
    raw = "http://localhost:3001,https://saransh.news"
    assert parse_origins(raw) == ["http://localhost:3001", "https://saransh.news"]


def test_parse_origins_strips_whitespace():
    raw = "  http://localhost:3001 ,\thttps://saransh.news  "
    assert parse_origins(raw) == ["http://localhost:3001", "https://saransh.news"]


def test_parse_origins_drops_trailing_comma():
    assert parse_origins("http://localhost:3001,") == ["http://localhost:3001"]


def test_parse_origins_empty_string_yields_no_origins():
    assert parse_origins("") == []
    assert parse_origins("   ") == []
    assert parse_origins(",,") == []


def test_default_cors_origins_preserve_local_dev():
    assert parse_origins(DEFAULT_CORS_ORIGINS) == [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]


def test_settings_exposes_parsed_cors_origins():
    assert isinstance(settings.CORS_ORIGINS, list)
    assert "http://localhost:3001" in settings.CORS_ORIGINS
