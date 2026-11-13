"""API router surface — stories and the signed-in User only."""

from app.api import router


def _iter_route_paths(routes):
    for route in routes:
        path = getattr(route, "path", None)
        if path:
            yield path
            continue

        original_router = getattr(route, "original_router", None)
        if original_router is not None:
            yield from _iter_route_paths(original_router.routes)
            continue

        include_context = getattr(route, "include_context", None)
        included_router = getattr(include_context, "included_router", None)
        if included_router is not None:
            yield from _iter_route_paths(included_router.routes)


def test_api_router_exposes_only_current_routes():
    paths = set(_iter_route_paths(router.routes))
    assert paths == {
        "/",
        "/health",
        "/stories",
        "/stories/{story_id}",
        "/users/sync",
        "/me",
        "/me/onboarding",
    }
