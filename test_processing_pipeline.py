from app.scrapers import UnifiedScraper
from app.processors import ContentProcessingPipeline
from app.ai.embedding_service import EmbeddingService
from app.utils import setup_logging

# Setup logging
setup_logging()

def test_full_pipeline():
    """Test the complete pipeline: scrape → process → store → search"""
    
    print("🚀 Testing Full Pipeline Integration")
    print("=" * 50)
    
    # Step 1: Scrape an article
    print("📰 Step 1: Scraping article...")
    scraper = UnifiedScraper()
    article = scraper.scrape_article(
        "https://www.ndtv.com/india-news/2-farmers-repairing-punctured-tyre-die-after-being-hit-by-speeding-car-in-rajasthan-8831095?pfrom=home-ndtv_mainnavigation",
        "ndtv"
    )
    
    if article.status != "success":
        print("❌ Failed to scrape article")
        return
    
    print(f"✅ Scraped: {article.title}")
    
    # Step 2: Process the article
    print("\n🔧 Step 2: Processing article...")
    pipeline = ContentProcessingPipeline(chunk_size=200, overlap=30)
    processed_article = pipeline.process_article(article)
    
    print(f"✅ Processed: {len(processed_article.chunks)} chunks created")
    print(f"📊 Analysis: {processed_article.analysis.word_count} words, {processed_article.analysis.sentence_count} sentences")
    
    # Step 3: Store embeddings
    print("\n💾 Step 3: Storing embeddings...")
    embedding_service = EmbeddingService()
    success = embedding_service.store_article_chunks(
        article_id=processed_article.original_article_id,
        chunks=processed_article.chunks
    )
    
    if success:
        print("✅ Embeddings stored successfully")
    else:
        print("❌ Failed to store embeddings")
        return
    
    # Step 4: Test similarity search
    print("\n🔍 Step 4: Testing similarity search...")
    
    # Test different queries
    test_queries = [
        "farmers accident",
        "car crash",
        "Rajasthan news",
        "tractor accident"
    ]
    
    for query in test_queries:
        print(f"\n🔎 Searching for: '{query}'")
        results = embedding_service.similarity_search(query, n_results=3)
        
        if results:
            print(f"✅ Found {len(results)} results")
            for i, result in enumerate(results[:2]):  # Show top 2
                print(f"  {i+1}. Similarity: {result['similarity']:.3f}")
                print(f"     Content: {result['content'][:100]}...")
        else:
            print("❌ No results found")
    
    print("\n✅ Full pipeline test completed!")

if __name__ == "__main__":
    test_full_pipeline()
