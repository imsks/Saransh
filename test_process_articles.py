#!/usr/bin/env python3
"""
Simple article processor
Takes article links from articles.json, scrapes, processes with agents, saves to processed.json
"""

import json
import requests
import logging
import time
from typing import Dict, List, Any
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ArticleProcessor:
    """Simple article processor"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def scrape_article(self, url: str) -> Dict[str, Any]:
        """Scrape article content from URL"""
        try:
            logger.info(f"🔄 Scraping: {url}")
            
            # Use your existing scraper or simple requests
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # For now, create mock data (replace with your scraper)
            # This should be replaced with actual scraping logic
            article_data = {
                "article_data": {
                    "title": f"Article from {url.split('/')[-1]}",
                    "content": f"This is sample content from {url}. Replace this with your actual scraper implementation.",
                    "url": url,
                    "source": "ndtv",
                    "published_date": "2024-01-01",
                    "author": "Sample Author"
                },
                "article_content": f"This is sample content from {url}. Replace this with your actual scraper implementation.",
                "article_metadata": {
                    "title": f"Article from {url.split('/')[-1]}",
                    "url": url,
                    "source": "ndtv",
                    "published_date": "2024-01-01",
                    "author": "Sample Author"
                },
                "user_preferences": {
                    "interests": ["general", "technology"],
                    "preferred_sources": ["ndtv"],
                    "content_type": "news"
                }
            }
            
            logger.info(f"✅ Scraped successfully")
            return article_data
            
        except Exception as e:
            logger.error(f"❌ Error scraping {url}: {e}")
            return {
                "article_data": {
                    "title": "Scraping Failed",
                    "content": "Content could not be scraped",
                    "url": url,
                    "source": "unknown",
                    "status": "failed"
                },
                "article_content": "Content could not be scraped",
                "article_metadata": {
                    "title": "Scraping Failed",
                    "url": url,
                    "source": "unknown",
                    "status": "failed"
                },
                "user_preferences": {
                    "interests": ["general"],
                    "preferred_sources": [],
                    "content_type": "news"
                }
            }
    
    def process_article(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process article through agents"""
        try:
            logger.info(f"🔄 Processing: {article_data.get('title', 'Unknown')[:50]}...")
            
            # Use the agents pipeline endpoint which actually exists
            response = requests.post(
                f"{self.base_url}/agents/pipeline",
                json={
                    "article_data": article_data,
                    "pipeline": ["curation", "summarization"]  # Use available agents
                },
                timeout=30
            )
            
            if response.status_code == 200:
                processed_article = response.json()
                # Add processing status for successful responses
                processed_article["processing_status"] = "success"
                processed_article["processed_at"] = datetime.now().isoformat()
                logger.info(f"✅ Processed successfully")
                return processed_article
            else:
                logger.error(f"❌ Processing failed: {response.status_code}")
                try:
                    error_detail = response.json()
                    logger.error(f"Error details: {error_detail}")
                except:
                    logger.error(f"Response text: {response.text}")
                
                return {
                    "error": f"Processing failed: {response.status_code}",
                    "original_article_link": article_data.get("article_data", {}).get("url", ""),
                    "title": article_data.get("article_data", {}).get("title", ""),
                    "processing_status": "failed",
                    "processed_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Error processing article: {e}")
            return {
                "error": str(e),
                "original_article_link": article_data.get("article_data", {}).get("url", ""),
                "title": article_data.get("article_data", {}).get("title", ""),
                "processing_status": "failed",
                "processed_at": datetime.now().isoformat()
            }
    
    def load_article_links(self) -> List[str]:
        """Load article links from articles.json"""
        try:
            with open("articles.json", "r", encoding='utf-8') as f:
                links = json.load(f)
            
            logger.info(f"📝 Loaded {len(links)} article links from articles.json")
            return links
            
        except FileNotFoundError:
            logger.error("❌ articles.json not found")
            return []
        except Exception as e:
            logger.error(f"❌ Error loading article links: {e}")
            return []
    
    def save_processed_articles(self, articles: List[Dict[str, Any]]):
        """Save processed articles to processed.json"""
        try:
            output_data = {
                "metadata": {
                    "total_articles": len(articles),
                    "processed_at": datetime.now().isoformat(),
                    "successful_articles": len([a for a in articles if a.get("processing_status") == "success"]),
                    "failed_articles": len([a for a in articles if a.get("processing_status") == "failed"])
                },
                "articles": articles
            }
            
            with open("processed.json", 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 Saved {len(articles)} articles to processed.json")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving to processed.json: {e}")
            return False
    
    def run(self):
        """Main processing pipeline"""
        logger.info("🚀 Starting article processing pipeline")
        
        # Check if API is running
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code != 200:
                logger.error("❌ API is not available. Please start the server first.")
                return False
        except Exception as e:
            logger.error(f"❌ Cannot connect to API: {e}")
            return False
        
        # Load article links
        links = self.load_article_links()
        if not links:
            logger.error("❌ No article links found")
            return False
        
        # Process each article
        processed_articles = []
        
        for i, link in enumerate(links, 1):
            logger.info(f"📝 Processing article {i}/{len(links)}")
            
            # Scrape article
            article_data = self.scrape_article(link)
            
            # Process with agents
            processed_article = self.process_article(article_data)
            
            processed_articles.append(processed_article)
            
            # Add delay to avoid rate limiting
            time.sleep(1)
        
        # Save results
        success = self.save_processed_articles(processed_articles)
        
        if success:
            logger.info("📊 Processing Summary:")
            successful = len([a for a in processed_articles if a.get("processing_status") == "success"])
            failed = len([a for a in processed_articles if a.get("processing_status") == "failed"])
            
            logger.info(f"  ✅ Successful: {successful}")
            logger.info(f"  ❌ Failed: {failed}")
            logger.info(f"  📁 Output file: processed.json")
            
            return True
        else:
            logger.error("❌ Failed to save processed articles")
            return False

def main():
    """Main function"""
    processor = ArticleProcessor()
    success = processor.run()
    
    if success:
        logger.info("🎉 Article processing completed successfully!")
    else:
        logger.error("💥 Article processing failed!")
    
    return success

if __name__ == "__main__":
    main() 