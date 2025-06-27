from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
from app.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Saransh - AI News App",
    description="An AI-powered news aggregation app inspired by InShorts",
    version="1.0.0",
    debug=settings.DEBUG
)

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 Saransh AI News App starting up...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Startup time: {datetime.now()}")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("🛑 Saransh AI News App shutting down...")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Saransh - AI News App",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.APP_ENV
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "saransh-news-app",
            "environment": settings.APP_ENV
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
