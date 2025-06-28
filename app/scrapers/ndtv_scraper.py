from bs4 import BeautifulSoup
from .selenium_base import SeleniumBaseScraper
import logging

logger = logging.getLogger(__name__)

class NDTVScraper(SeleniumBaseScraper):
    """NDTV scraper using Selenium"""
    
    def __init__(self):
        super().__init__("NDTV")
    
    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title from NDTV"""
        selectors = [
            'h1[class*="title"]',
            'h1[class*="headline"]',
            'h1',
            '.article_title',
            '.headline'
        ]
        
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return ""
    
    def extract_content(self, soup: BeautifulSoup) -> str:
        """Extract content from NDTV"""
        selectors = [
            '.sp-descp',
            '.Art-exp_wr'
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                content_parts = []
                for elem in elements:
                    # Get all paragraphs
                    paragraphs = elem.find_all('p')
                    for p in paragraphs:
                        text = p.get_text(strip=True)
                        if text and len(text) > 20:  # Only meaningful paragraphs
                            content_parts.append(text)
                    
                    # If no paragraphs found, get direct text content
                    if not content_parts:
                        # Get all text content from the element
                        text_content = elem.get_text(strip=True)
                        if text_content and len(text_content) > 50:
                            content_parts.append(text_content)
                
                if content_parts:
                    return ' '.join(content_parts)
        
        return ""
    
    def extract_metadata(self, soup: BeautifulSoup) -> dict:
        """Extract metadata from NDTV"""
        metadata = {}
        
        try:
            # Find the navigation section with metadata
            nav_section = soup.find('nav', {'class': 'pst-by'})
            if nav_section:
                # Extract Author
                author_spans = nav_section.find_all('span', {'class': 'pst-by_txt'})
                for span in author_spans:
                    text = span.get_text(strip=True)
                    if text and text != "Reported by":
                        metadata['author'] = text
                        break
                
                # Extract Category (from links)
                category_links = nav_section.find_all('a', {'class': 'pst-by_lnk'})
                for link in category_links:
                    href = link.get('href', '')
                    if 'india' in href or 'world' in href or 'business' in href:
                        metadata['category'] = link.get_text(strip=True)
                        break
                
                # Extract Language from meta tag, default to "English"
                lang_meta = soup.find('meta', {'name': 'inLanguage'})
                if lang_meta:
                    metadata['language'] = lang_meta.get('content', 'English')
                else:
                    metadata['language'] = 'English'
                
                # Extract Published Date from multiple sources
                # 1. Try meta tag first (most accurate)
                publish_meta = soup.find('meta', {'name': 'publish-date'})
                if publish_meta:
                    metadata['published_date'] = publish_meta.get('content', '')
                else:
                    # 2. Try span with itemprop
                    date_span = nav_section.find('span', {'itemprop': 'dateModified'})
                    if date_span:
                        metadata['published_date'] = date_span.get_text(strip=True)
            
            # Fallback selectors if nav section not found
            if not metadata.get('published_date'):
                date_selectors = ['[class*="date"]', 'time', '.published_date']
                for selector in date_selectors:
                    elem = soup.select_one(selector)
                    if elem:
                        metadata['published_date'] = elem.get_text(strip=True)
                        break
            
            if not metadata.get('author'):
                author_selectors = ['[class*="author"]', '.author_name']
                for selector in author_selectors:
                    elem = soup.select_one(selector)
                    if elem:
                        metadata['author'] = elem.get_text(strip=True)
                        break
                        
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
        
        return metadata