"""API router surface — ingestion and waitlist only."""

from app.api import router


def test_api_router_has_no_scraper_or_agent_routes():
    paths = {route.path for route in router.routes}
    assert not any("articles" in path for path in paths)
    assert not any("agents" in path for path in paths)
    assert "/health" in paths
    assert "/waitlist" in paths
