from datetime import datetime

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.config import settings
from app.db.bootstrap import init_database
from app.utils import get_logger, setup_logging

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Saransh - AI News App",
    description="Story ingestion and waitlist API for Saransh",
    version="1.0.0",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Include versioned API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    logger.info(
        "app.startup",
        environment=settings.APP_ENV,
        debug=settings.DEBUG,
        started_at=datetime.now().isoformat(),
    )
    init_database()


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("app.shutdown")


if __name__ == "__main__":
    # Development configuration with auto-reload
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower(),
    )
