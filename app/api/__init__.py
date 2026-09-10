from fastapi import APIRouter

from .common import router as common_router
from .waitlist import router as waitlist_router

router = APIRouter(tags=["API v1"])
router.include_router(common_router)
router.include_router(waitlist_router)
