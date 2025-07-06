from app.scrapers import UnifiedScraper
from app.processors import ContentProcessingPipeline
from app.utils import setup_logging
import json

# Setup logging
setup_logging()

def test_processing_pipeline():
    # Step 1: Scrape an article
    scraper = UnifiedScraper()
    article = scraper.scrape_article(
        "https://www.ndtv.com/india-news/2-farmers-repairing-punctured-tyre-die-after-being-hit-by-speeding-car-in-rajasthan-8831095?pfrom=home-ndtv_mainnavigation",
        "ndtv"
    )
    
    if article.status != "success":
        print("❌ Failed to scrape article")
        return
    
    # Step 2: Process the article
    pipeline = ContentProcessingPipeline(chunk_size=200, overlap=30)
    processed_article = pipeline.process_article(article)
    
    # Step 3: Display results
    print(f" Title: {processed_article.title}")
    print(f"📊 Analysis:")
    print(f"   - Words: {processed_article.analysis.word_count}")
    print(f"   - Sentences: {processed_article.analysis.sentence_count}")
    print(f"   - Readability: {processed_article.analysis.readability_score:.2f}")
    print(f"   - Sentiment: {processed_article.analysis.sentiment_score:.3f}")
    print(f"   - Entities: {processed_article.analysis.entities[:5]}")
    print(f"   - Topics: {processed_article.analysis.key_topics}")
    print(f"📝 Chunks: {len(processed_article.chunks)}")
    
    # Save to JSON
    with open('processed_article.json', 'w', encoding='utf-8') as f:
        json.dump(processed_article.to_dict(), f, indent=2, ensure_ascii=False)
    
    print(" Saved to processed_article.json")

if __name__ == "__main__":
    test_processing_pipeline()
