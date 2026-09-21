"""Settings parsing contract."""

from __future__ import annotations

from app.config import (
    DEFAULT_CORS_ORIGINS,
    PRODUCTION_FRONTEND_ORIGINS,
    build_cors_origins,
    parse_origins,
    settings,
)


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
    assert PRODUCTION_FRONTEND_ORIGINS in settings.CORS_ORIGINS


def test_build_cors_origins_always_includes_production_frontend():
    origins = build_cors_origins(DEFAULT_CORS_ORIGINS)
    assert origins[:2] == [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    assert PRODUCTION_FRONTEND_ORIGINS in origins


def test_build_cors_origins_does_not_duplicate_production_frontend():
    origins = build_cors_origins(
        f"https://preview.example,{PRODUCTION_FRONTEND_ORIGINS}"
    )
    assert origins.count(PRODUCTION_FRONTEND_ORIGINS) == 1
    assert origins == [
        "https://preview.example",
        PRODUCTION_FRONTEND_ORIGINS,
    ]


def test_build_cors_origins_empty_raw_still_allows_production_frontend():
    assert build_cors_origins("") == [PRODUCTION_FRONTEND_ORIGINS]
