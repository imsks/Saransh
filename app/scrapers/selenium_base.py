from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import logging
from abc import ABC, abstractmethod
from .models import ScrapedArticle
from datetime import datetime

logger = logging.getLogger(__name__)

class SeleniumBaseScraper(ABC):
    """Base class for all Selenium-based scrapers"""
    
    def __init__(self, source_name: str):
        self.source_name = source_name
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
        
        # Use webdriver-manager to automatically get Chrome driver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    def scrape_article(self, url: str) -> ScrapedArticle:
        """Main method to scrape a single article"""
        try:
            logger.info(f"🌐 Loading: {url}")
            self.driver.get(url)
            
            # Wait for page to load
            time.sleep(3)
            
            # Get page source after JavaScript execution
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Extract data using platform-specific methods
            title = self.extract_title(soup)
            content = self.extract_content(soup)
            metadata = self.extract_metadata(soup)
            image_url = self.extract_image(soup)
            
            # Clean text
            title = self.clean_text(title)
            content = self.clean_text(content)
            
            return ScrapedArticle(
                title=title,
                content=content,
                source=self.source_name,
                url=url,
                image_url=image_url,
                published_date=metadata.get('published_date'),
                author=metadata.get('author'),
                category=metadata.get('category'),
                language=metadata.get('language'),
                scraped_at=datetime.now(),
                status="success"
            )
            
        except Exception as e:
            logger.error(f"❌ Error scraping {url}: {e}")
            return ScrapedArticle(
                title="",
                content="",
                source=self.source_name,
                url=url,
                image_url="",
                scraped_at=datetime.now(),
                status="failed"
            )
    
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
        """Extract metadata - must be implemented by child classes"""
        pass
    
    @abstractmethod
    def extract_image(self, soup: BeautifulSoup) -> str:
        """Extract image URL - must be implemented by child classes"""
        pass
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text.strip()
    
    def __del__(self):
        """Cleanup driver"""
        if self.driver:
            self.driver.quit() 