"""Next.js /api/v1 rewrite — production waitlist stays same-origin."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEXT_CONFIG = ROOT / "frontend" / "next.config.mjs"


def test_next_config_rewrites_api_v1():
    text = NEXT_CONFIG.read_text()
    assert 'source: "/api/v1/:path*"' in text
    assert "/api/v1/:path*" in text
    assert "destination:" in text


def test_next_config_proxies_posthog_through_saransh_origin():
    """Analytics goes to /ingest on Saransh's origin, not *.posthog.com (ADR 0004)."""
    text = NEXT_CONFIG.read_text()
    assert 'source: "/ingest/:path*"' in text
    assert 'source: "/ingest/static/:path*"' in text
    # PostHog's paths end in a slash; Next must not redirect them.
    assert "skipTrailingSlashRedirect: true" in text


def test_posthog_assets_rule_precedes_the_ingest_catch_all():
    """Next.js takes the first matching rewrite, so the narrower assets rule goes first."""
    text = NEXT_CONFIG.read_text()
    assert text.index('source: "/ingest/static/:path*"') < text.index(
        'source: "/ingest/:path*"'
    )


def test_posthog_proxy_targets_are_environment_configurable():
    text = NEXT_CONFIG.read_text()
    assert "process.env.POSTHOG_PROXY_INGEST_HOST" in text
    assert "process.env.POSTHOG_PROXY_ASSETS_HOST" in text
    assert "https://us.i.posthog.com" in text
    assert "https://us-assets.i.posthog.com" in text


def test_frontend_analytics_defaults_to_the_first_party_path():
    config = ROOT / "frontend" / "src" / "lib" / "analytics" / "config.ts"
    assert 'DEFAULT_POSTHOG_HOST = "/ingest"' in config.read_text()
