from fastapi import FastAPI
import uvicorn
import logging
from datetime import datetime
from app.config import settings
from app.utils import setup_logging
from app.api import router as api_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Saransh - AI News App",
    description="An AI-powered news aggregation app inspired by InShorts",
    version="1.0.0",
    debug=settings.DEBUG
)

# Include versioned API router
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Saransh AI News App starting up...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Startup time: {datetime.now()}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Saransh AI News App shutting down...")

if __name__ == "__main__":
    # Development configuration with auto-reload
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
