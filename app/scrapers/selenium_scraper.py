from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
from .base_scraper import BaseScrapper
from .models import ScrapedArticle
from datetime import datetime

class SeleniumNDTVScraper(BaseScrapper):
    """NDTV scraper using Selenium to bypass bot detection"""
    
    def __init__(self):
        super().__init__("NDTV")
        self.driver = None
        self.setup_driver()
    
    def setup_driver(self):
        """Setup Chrome driver with anti-detection options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in background
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    def scrape_article(self, url: str) -> ScrapedArticle:
        """Scrape article using Selenium"""
        try:
            print(f"🌐 Loading: {url}")
            self.driver.get(url)
            
            # Wait for page to load
            time.sleep(1)
            
            # Get page source after JavaScript execution
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Extract data
            title = self.extract_title(soup)
            print("TITLE", title)
            content = self.extract_content(soup)
            print("CONTENT", content)
            metadata = self.extract_metadata(soup)
            print("METADATA", metadata)
            
            return ScrapedArticle(
                title=title,
                content=content,
                source="NDTV",
                url=url,
                published_date=metadata.get('published_date'),
                author=metadata.get('author'),
                category=metadata.get('category'),
                language=metadata.get('language'),
                scraped_at=datetime.now(),
                status="success"
            )
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return ScrapedArticle(
                title="",
                content="",
                source="NDTV",
                url=url,
                scraped_at=datetime.now(),
                status="failed"
            )
    
    def extract_title(self, soup: BeautifulSoup) -> str:
        """Extract title from NDTV"""
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
        # Target the specific div with id="ignorediv"
        content_div = soup.find('div', {'class': 'Art-exp_wr', 'id': 'ignorediv'})
        
        if content_div:
            content_parts = []
            
            # Get all paragraphs
            paragraphs = content_div.find_all('p')
            for p in paragraphs:
                text = p.get_text(strip=True)
                if text and len(text) > 20:
                    content_parts.append(text)
            
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
            print(f"Error extracting metadata: {e}")
        
        return metadata
    
    def __del__(self):
        """Cleanup driver"""
        if self.driver:
            self.driver.quit()
