from fastapi import APIRouter
from .common import router as common_router
from .waitlist import router as waitlist_router

# Create main API router with version info
router = APIRouter(tags=["API v1"])
router.include_router(common_router)
router.include_router(waitlist_router)


def include_optional_routers() -> None:
    """Attach heavier routers when optional scraping/agent deps are installed."""
    try:
        from .agents import router as agents_router
        from .articles import router as articles_router
    except ImportError as exc:
        import logging

        logging.getLogger(__name__).warning(
            "Optional Saransh routers disabled (agents/articles): %s", exc
        )
        return

    router.include_router(agents_router)
    router.include_router(articles_router)


include_optional_routers()
