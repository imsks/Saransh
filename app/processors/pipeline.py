from datetime import datetime
from typing import List
from ..scrapers.models import ScrapedArticle
from .models import ContentAnalysis, ProcessedArticle
from .chunker import ContentChunker
from .analyzer import ContentAnalyzer
import logging

logger = logging.getLogger(__name__)

class ContentProcessingPipeline:
    """Main pipeline for processing scraped articles"""
    
    def __init__(self, chunk_size: int = 300, overlap: int = 50):
        self.chunker = ContentChunker(chunk_size, overlap)
        self.analyzer = ContentAnalyzer()
    
    def process_article(self, article: ScrapedArticle) -> ProcessedArticle:
        """Process a single article through the pipeline"""
        try:
            logger.info(f"Processing article: {article.title}")
            
            # Step 1: Chunk the content
            chunks = self.chunker.chunk_text(article.content)
            logger.info(f"Created {len(chunks)} chunks")
            
            # Step 2: Analyze the content
            analysis = self.analyzer.analyze(article.content)
            logger.info(f"Analysis completed - {analysis.word_count} words, {analysis.sentence_count} sentences")
            
            # Step 3: Create processed article
            processed_article = ProcessedArticle(
                original_article_id=article.url,
                title=article.title,
                clean_content=article.content,
                chunks=chunks,
                analysis=analysis,
                processed_at=datetime.now()
            )
            
            logger.info(f"Successfully processed article: {article.title}")
            return processed_article
            
        except Exception as e:
            logger.error(f"Error processing article {article.title}: {e}")
            return ProcessedArticle(
                original_article_id=article.url,
                title=article.title,
                clean_content="",
                chunks=[],
                analysis=ContentAnalysis(word_count=0, sentence_count=0, readability_score=0, sentiment_score=0),
                processed_at=datetime.now(),
                processing_status="failed"
            )
    
    def process_multiple_articles(self, articles: List[ScrapedArticle]) -> List[ProcessedArticle]:
        """Process multiple articles"""
        processed_articles = []
        
        for article in articles:
            processed = self.process_article(article)
            processed_articles.append(processed)
        
        return processed_articles
