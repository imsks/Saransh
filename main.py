from fastapi import FastAPI
import uvicorn
import logging
from datetime import datetime
from app.ai.embedding_service import EmbeddingService
from app.config import settings
from app.utils import setup_logging

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

@app.get("/search")
async def search_articles(query: str, limit: int = 5):
    """Search for articles using semantic similarity"""
    embedding_service = EmbeddingService()
    results = embedding_service.similarity_search(query, limit)
    
    return {
        "query": query,
        "results": results,
        "total_found": len(results)
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
