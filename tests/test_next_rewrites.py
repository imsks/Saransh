"""Next.js /api/v1 rewrite — production waitlist stays same-origin."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEXT_CONFIG = ROOT / "frontend" / "next.config.mjs"


def test_next_config_rewrites_api_v1():
    text = NEXT_CONFIG.read_text()
    assert 'source: "/api/v1/:path*"' in text
    assert "/api/v1/:path*" in text
    assert "destination:" in text
