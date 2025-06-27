from app.scrapers.models import ScrapedArticle
from datetime import datetime

# Test the data model
def test_model():
    article = ScrapedArticle(
        title="Test Article",
        content="This is test content",
        source="Test Source",
        url="https://example.com",
        scraped_at=datetime.now()
    )
    
    print("✅ Data model works!")
    print(f"Article: {article.title}")
    print(f"JSON: {article.model_dump_json()}")

if __name__ == "__main__":
    test_model()