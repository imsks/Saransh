from app.scrapers.unified_scraper import UnifiedScraper
import json

def test_unified_scraper():
    scraper = UnifiedScraper()
    
    # Test URLs for different platforms
    test_urls = [
        {
            'platform': 'ndtv',
            'url': 'https://www.ndtv.com/india-news/office-party-days-after-air-india-boeing-787-crash-aisats-sacks-4-senior-employees-8777266'
        }
        # Add more platforms as we build them
        # {
        #     'platform': 'indian_express',
        #     'url': 'https://indianexpress.com/article/...'
        # }
    ]
    
    print("🌐 Testing Unified Scraper...")
    print(f"Available platforms: {scraper.get_available_platforms()}")
    
    for url_info in test_urls:
        platform = url_info['platform']
        url = url_info['url']
        
        print(f"\n🔍 Testing {platform.upper()}...")
        print(f"URL: {url}")
        
        # Scrape the article
        article = scraper.scrape_article(url, platform)
        
        # Print results
        print(f"📰 Title: {article.title}")
        print(f"📝 Content Length: {len(article.content)} characters")
        print(f"🖼️ Image URL: {article.image_url}")
        print(f"👤 Author: {article.author}")
        print(f"📅 Published Date: {article.published_date}")
        print(f"🏷️ Category: {article.category}")
        print(f"🌐 Language: {article.language}")
        print(f"✅ Status: {article.status}")
        
        if article.status == "success":
            # Save to JSON file
            article_dict = article.model_dump()
            article_dict['scraped_at'] = article_dict['scraped_at'].isoformat()
            
            filename = f'{platform}_article.json'
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(article_dict, f, indent=2, ensure_ascii=False)
            print(f"💾 Article saved to {filename}")
        else:
            print(f"❌ Scraping failed: {article.status}")

if __name__ == "__main__":
    test_unified_scraper() 