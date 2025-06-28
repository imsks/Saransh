from abc import ABC, abstractmethod
import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from typing import Optional
from .models import ScrapedArticle
from .utils import rotate_session_headers

logger = logging.getLogger(__name__)

class BaseScrapper(ABC):
    """Base Class for Scraping Websites"""

    def __init__(self, source_name: str):
        self.source_name = source_name
        self.session = requests.Session()
        self.setup_session()
        self.request_count = 0

    def setup_session(self):
        """Setup the requests session with anti-bot detection"""
        # Rotate user agent
        rotate_session_headers(self.session)
        
        # Add other headers
        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        self.session.headers.update(headers)

    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch page with anti-bot measures"""
        try:
            # Rotate headers every 5 requests
            if self.request_count % 5 == 0:
                rotate_session_headers(self.session)
            
            # Add random delay
            self.add_random_delay()
            
            logger.info(f"Fetching {url} (request #{self.request_count + 1})")
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            self.request_count += 1
            
            return BeautifulSoup(response.text, "html.parser")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
        
    @abstractmethod
    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title - must be implemented by child classes"""
        pass
        
    @abstractmethod
    def extract_content(self, soup: BeautifulSoup) -> str:
        """Extract article content - must be implemented by child classes"""
        pass

    @abstractmethod
    def extract_metadata(self, soup: BeautifulSoup) -> dict:
        """Extract metadata (date, author, etc.) - must be implemented by child classes"""
        pass

    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text.strip()
    
    def scrape_article(self, url: str) -> ScrapedArticle:
        """Main method to scrape a single article"""
        try:
            # Get the page
            soup = self.get_page(url)
            if not soup:
                return ScrapedArticle(
                    title="",
                    content="",
                    source=self.source_name,
                    url=url,
                    scraped_at=datetime.now(),
                    status="failed"
                )
            
            # Extract data
            title = self.extract_title(soup)
            content = self.extract_content(soup)
            metadata = self.extract_metadata(soup)
            
            # Clean text
            title = self.clean_text(title)
            content = self.clean_text(content)
            
            # Create article object
            article = ScrapedArticle(
                title=title,
                content=content,
                source=self.source_name,
                url=url,
                published_date=metadata.get('published_date'),
                author=metadata.get('author'),
                category=metadata.get('category'),
                language=metadata.get('language'),
                scraped_at=datetime.now(),
                status="success"
            )
            
            logger.info(f"Successfully scraped: {title}")
            return article
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return ScrapedArticle(
                title="",
                content="",
                source=self.source_name,
                url=url,
                scraped_at=datetime.now(),
                status="failed"
            )