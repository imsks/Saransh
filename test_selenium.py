from app.scrapers.selenium_scraper import SeleniumNDTVScraper
import json

def test_selenium_scraper():
    scraper = SeleniumNDTVScraper()
    
    # Test with a real NDTV article URL
    test_url = "https://www.ndtv.com/india-news/office-party-days-after-air-india-boeing-787-crash-aisats-sacks-4-senior-employees-8777266"
    
    print("🌐 Testing Selenium NDTV Scraper...")
    print(f"URL: {test_url}")
    
    # Scrape the article
    article = scraper.scrape_article(test_url)
    
    # Print results
    print(f"\n📰 Title: {article.title}")
    print(f"📝 Content Length: {len(article.content)} characters")
    print(f"👤 Author: {article.author}")
    print(f"📅 Date: {article.published_date}")
    print(f"🏷️ Category: {article.category}")
    print(f"✅ Status: {article.status}")
    
    if article.status == "success":
        # Save to JSON file
        article_dict = article.model_dump()
        # Convert datetime to string manually
        article_dict['scraped_at'] = article_dict['scraped_at'].isoformat()
        
        with open('selenium_article.json', 'w', encoding='utf-8') as f:
            json.dump(article_dict, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Article saved to selenium_article.json")
    else:
        print(f"\n❌ Scraping failed: {article.status}")

if __name__ == "__main__":
    test_selenium_scraper()
