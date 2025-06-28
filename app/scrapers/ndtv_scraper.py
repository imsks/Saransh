from bs4 import BeautifulSoup
from .base_scraper import BaseScrapper
import logging

logger = logging.getLogger(__name__)

class NDTVScraper(BaseScrapper):
    """Scraper for NDTV news articles"""
    
    def __init__(self):
        super().__init__("NDTV")
    
    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title from NDTV"""
        try:
            # Try multiple selectors for title
            title_selectors = [
                'h1[class*="title"]',
                'h1[class*="headline"]',
                'h1',
                '.article_title',
                '.headline'
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    return title_elem.get_text(strip=True)
            
            logger.warning("Could not find title")
            return ""
            
        except Exception as e:
            logger.error(f"Error extracting title: {e}")
            return ""
    
    def extract_content(self, soup: BeautifulSoup) -> str:
        """Extract article content from NDTV"""
        try:
            # Try multiple selectors for content
            content_selectors = [
                '.content_text',
                '.article_content',
                '.story_content',
                '[class*="content"]',
                '[class*="article"]'
            ]
            
            content_parts = []
            
            for selector in content_selectors:
                elements = soup.select(selector)
                for elem in elements:
                    # Get all paragraphs
                    paragraphs = elem.find_all('p')
                    for p in paragraphs:
                        text = p.get_text(strip=True)
                        if text and len(text) > 20:  # Only meaningful paragraphs
                            content_parts.append(text)
                
                if content_parts:
                    break
            
            return ' '.join(content_parts)
            
        except Exception as e:
            logger.error(f"Error extracting content: {e}")
            return ""
    
    def extract_metadata(self, soup: BeautifulSoup) -> dict:
        """Extract metadata from NDTV"""
        metadata = {}
        
        try:
            # Extract published date
            date_selectors = [
                '[class*="date"]',
                '[class*="time"]',
                'time',
                '.published_date'
            ]
            
            for selector in date_selectors:
                date_elem = soup.select_one(selector)
                if date_elem:
                    metadata['published_date'] = date_elem.get_text(strip=True)
                    break
            
            # Extract author
            author_selectors = [
                '[class*="author"]',
                '[class*="byline"]',
                '.author_name'
            ]
            
            for selector in author_selectors:
                author_elem = soup.select_one(selector)
                if author_elem:
                    metadata['author'] = author_elem.get_text(strip=True)
                    break
            
            # Extract category (from breadcrumbs or tags)
            category_selectors = [
                '[class*="category"]',
                '[class*="section"]',
                '.breadcrumb a',
                '.tag'
            ]
            
            for selector in category_selectors:
                category_elem = soup.select_one(selector)
                if category_elem:
                    metadata['category'] = category_elem.get_text(strip=True)
                    break
                    
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
        
        return metadata