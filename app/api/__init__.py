from fastapi import APIRouter

from .common import router as common_router
from .stories import router as stories_router
from .users import router as users_router

router = APIRouter(tags=["API v1"])
router.include_router(common_router)
router.include_router(stories_router)
router.include_router(users_router)
