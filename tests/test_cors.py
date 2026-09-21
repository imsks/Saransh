"""CORS contract: the allowlist comes from settings, and PATCH preflights pass."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from app.config import settings


def _client() -> TestClient:
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.get("/api/v1/health")
    def health():
        return {"status": "ok"}

    return TestClient(app)


def _preflight(origin: str, method: str = "POST"):
    return _client().options(
        "/api/v1/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
        },
    )


def test_preflight_from_configured_origin_is_allowed():
    response = _preflight(settings.CORS_ORIGINS[0])
    assert (
        response.headers.get("access-control-allow-origin") == settings.CORS_ORIGINS[0]
    )


def test_preflight_from_unconfigured_origin_is_not_allowed():
    response = _preflight("https://not-allowed.example")
    assert "access-control-allow-origin" not in response.headers


def test_patch_preflight_is_allowed():
    response = _preflight(settings.CORS_ORIGINS[0], method="PATCH")
    allowed = response.headers.get("access-control-allow-methods", "")
    assert "PATCH" in allowed


def test_main_middleware_matches_this_configuration():
    import main

    cors = [m for m in main.app.user_middleware if m.cls is CORSMiddleware]
    assert len(cors) == 1
    options = cors[0].kwargs
    assert options["allow_origins"] == settings.CORS_ORIGINS
    assert "PATCH" in options["allow_methods"]
