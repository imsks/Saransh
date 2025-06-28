from typing import Dict, Type
from .selenium_base import SeleniumBaseScraper
from .ndtv_scraper import NDTVScraper

class ScraperFactory:
    """Factory for creating scrapers"""
    
    _scrapers: Dict[str, Type[SeleniumBaseScraper]] = {
        'ndtv': NDTVScraper,
        # Add more scrapers here as we build them
        # 'indian_express': IndianExpressScraper,
        # 'times_of_india': TimesOfIndiaScraper,
    }
    
    @classmethod
    def get_scraper(cls, platform: str) -> SeleniumBaseScraper:
        """Get a scraper instance for the specified platform"""
        platform = platform.lower()
        
        if platform not in cls._scrapers:
            raise ValueError(f"Unsupported platform: {platform}. Available: {list(cls._scrapers.keys())}")
        
        scraper_class = cls._scrapers[platform]
        return scraper_class()
    
    @classmethod
    def get_available_platforms(cls) -> list:
        """Get list of available platforms"""
        return list(cls._scrapers.keys())
    
    @classmethod
    def register_scraper(cls, platform: str, scraper_class: Type[SeleniumBaseScraper]):
        """Register a new scraper"""
        cls._scrapers[platform.lower()] = scraper_class 