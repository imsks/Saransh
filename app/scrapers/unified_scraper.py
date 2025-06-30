from typing import List
from .factory import ScraperFactory
from .models import ScrapedArticle
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UnifiedScraper:
    """Unified interface for all scrapers"""
    
    def __init__(self):
        self.factory = ScraperFactory()
    
    def scrape_article(self, url: str, platform: str) -> ScrapedArticle:
        """Scrape a single article from a specific platform"""
        try:
            scraper = self.factory.get_scraper(platform)
            return scraper.scrape_article(url)
        except Exception as e:
            logger.error(f"Error creating scraper for {platform}: {e}")
            return ScrapedArticle(
                title="",
                content="",
                source=platform,
                url=url,
                image_url="",
                scraped_at=datetime.now(),
                status="failed"
            )
    
    def scrape_multiple_articles(self, urls: List[dict]) -> List[ScrapedArticle]:
        """Scrape multiple articles from different platforms"""
        articles = []
        
        for url_info in urls:
            url = url_info['url']
            platform = url_info['platform']
            
            logger.info(f"Scraping {platform}: {url}")
            article = self.scrape_article(url, platform)
            articles.append(article)
        
        return articles
    
    def get_available_platforms(self) -> List[str]:
        """Get list of available platforms"""
        return self.factory.get_available_platforms()
    
    def test_platform(self, platform: str, test_url: str) -> bool:
        """Test if a platform scraper works with a given URL"""
        try:
            article = self.scrape_article(test_url, platform)
            return article.status == "success"
        except Exception as e:
            logger.error(f"Platform test failed for {platform}: {e}")
            return False 