from fastapi import FastAPI
import uvicorn
import logging
from datetime import datetime
from app.ai.embedding_service import EmbeddingService
from app.agents.agent_manager import agent_manager
from app.config import settings
from app.utils import setup_logging
from typing import Dict, List
import logging

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


@app.post("/agents/curate")
async def curate_article(article_data: Dict):
    """Curate an article using the Content Curation Agent"""
    result = agent_manager.execute_agent("curation", article_data)
    return result

@app.post("/agents/summarize")
async def summarize_article(article_data: Dict):
    """Summarize an article using the Summarization Agent"""
    result = agent_manager.execute_agent("summarization", article_data)
    return result

@app.post("/agents/fact-check")
async def fact_check_article(article_data: Dict):
    """Fact-check an article using the Fact-Checking Agent"""
    result = agent_manager.execute_agent("fact_checking", article_data)
    return result

@app.post("/agents/analyze-trends")
async def analyze_trends(article_data: Dict):
    """Analyze trends using the Trend Analysis Agent"""
    result = agent_manager.execute_agent("trend_analysis", article_data)
    return result

@app.post("/agents/pipeline")
async def run_agent_pipeline(article_data: Dict, pipeline: List[str] = None):
    """Run a complete agent pipeline on an article"""
    result = agent_manager.execute_pipeline(article_data, pipeline)
    return result

@app.get("/agents/stats")
async def get_agent_stats():
    """Get statistics for all agents"""
    return agent_manager.get_agent_stats()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
