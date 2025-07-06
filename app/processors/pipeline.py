from datetime import datetime
from typing import List

from app.processors.semantic_chunker import SemanticChunker
from app.scrapers.models import ScrapedArticle
from .models import ProcessedArticle
from .analyzer import AIContentAnalyzer
import logging
from app.ai.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

class ContentProcessingPipeline:
    """Main pipeline for processing scraped articles"""
    
    def __init__(self, chunk_size: int = 300, overlap: int = 50):
        self.chunker = SemanticChunker(chunk_size)
        self.analyzer = AIContentAnalyzer()
        self.embedding_service = EmbeddingService()
    
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
            
            # Store embeddings
            self.embedding_service.store_article_chunks(
                article_id=processed_article.original_article_id,
                chunks=processed_article.chunks
            )
            
            logger.info(f"Successfully processed article: {article.title}")
            return processed_article
            
        except Exception as e:
            logger.error(f"Error processing article {article.title}: {e}")
            return self._fallback_processing(article)
        
    def _fallback_processing(self, article: ScrapedArticle) -> ProcessedArticle:
        """Fallback processing without AI"""
        # Use basic chunker and analyzer
        from .chunker import ContentChunker
        from .analyzer import ContentAnalyzer
        
        basic_chunker = ContentChunker()
        basic_analyzer = ContentAnalyzer()
        
        chunks = basic_chunker.chunk_text(article.content)
        analysis = basic_analyzer.analyze(article.content)
        
        return ProcessedArticle(
            original_article_id=article.url,
            title=article.title,
            clean_content=article.content,
            chunks=chunks,
            analysis=analysis,
            processed_at=datetime.now(),
            processing_status="fallback"
        )
    
    def process_multiple_articles(self, articles: List[ScrapedArticle]) -> List[ProcessedArticle]:
        """Process multiple articles"""
        processed_articles = []
        
        for article in articles:
            processed = self.process_article(article)
            processed_articles.append(processed)
        
        return processed_articles
