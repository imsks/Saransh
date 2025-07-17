from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging
from app.scrapers import UnifiedScraper
from app.processors import ContentProcessingPipeline
from app.ai.embedding_service import EmbeddingService

router = APIRouter(prefix="/articles", tags=["Articles"])
logger = logging.getLogger(__name__)

class URLRequest(BaseModel):
    urls: List[Dict[str, str]]  # List of {"url": ..., "platform": ...}
    user_preferences: Optional[Dict[str, Any]] = None

class ProcessedArticleResponse(BaseModel):
    original_url: str
    platform: str
    title: str
    summary: str
    analysis: Dict[str, Any]
    processing_status: str
    processed_at: str

@router.post("/process", response_model=List[ProcessedArticleResponse])
async def process_articles(request: URLRequest):
    try:
        logger.info(f"Processing {len(request.urls)} articles")
        scraper = UnifiedScraper()
        pipeline = ContentProcessingPipeline()
        processed_articles = []
        for url_info in request.urls:
            url = url_info.get("url")
            platform = url_info.get("platform", "ndtv")
            if not url:
                logger.warning("Skipping article with no URL")
                continue
            try:
                scraped_article = scraper.scrape_article(url, platform)
                if scraped_article.status != "success":
                    logger.error(f"Failed to scrape article: {url}")
                    continue
                processed_article = pipeline.process_article(scraped_article)
                # Summarization/curation can be handled via agents API
                final_article = ProcessedArticleResponse(
                    original_url=processed_article.original_article_link,
                    platform=platform,
                    title=processed_article.title,
                    summary=processed_article.analysis.ai_summary or "Summary not available",
                    analysis=processed_article.analysis.model_dump(),
                    processing_status=processed_article.processing_status,
                    processed_at=processed_article.processed_at.isoformat()
                )
                processed_articles.append(final_article)
                logger.info(f"Successfully processed article: {processed_article.title}")
            except Exception as e:
                logger.error(f"Error processing article {url}: {e}")
                error_article = ProcessedArticleResponse(
                    original_url=url,
                    platform=platform,
                    title="Error processing article",
                    summary="Failed to process article",
                    analysis={
                        "error": "processing failed"
                    },
                    processing_status="failed",
                    processed_at=datetime.now().isoformat()
                )
                processed_articles.append(error_article)
        logger.info(f"Completed processing {len(processed_articles)} articles")
        return processed_articles
    except Exception as e:
        logger.error(f"Error in process_articles endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/search")
async def search_articles(query: str, limit: int = 5):
    embedding_service = EmbeddingService()
    results = embedding_service.similarity_search(query, limit)
    return {
        "query": query,
        "results": results,
        "total_found": len(results)
    }

@router.get("/platforms")
async def get_available_platforms():
    scraper = UnifiedScraper()
    return {
        "available_platforms": scraper.get_available_platforms()
    } 