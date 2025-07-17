from fastapi import APIRouter
from .agents import router as agents_router
from .articles import router as articles_router
from .common import router as common_router

# Create main API router with version info
router = APIRouter(tags=["API v1"])
# Include all sub-routers
router.include_router(common_router)
router.include_router(agents_router)
router.include_router(articles_router)
