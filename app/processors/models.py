from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class ContentChunk(BaseModel):
    """Represents a chunk of processed content"""
    id: str
    content: str
    chunk_index: int
    word_count: int
    start_position: int
    end_position: int
    metadata: Dict[str, Any] = {}

class ContentAnalysis(BaseModel):
    """Represents the analysis of a content chunk"""
    word_count: int
    sentence_count: int
    readability_score: float
    sentiment_score: float
    entities: List[str] = []
    key_topics: List[str] = []
    language: str = "English"
    content_type: str = "news"

class ProcessedArticle(BaseModel):
    """Final processed article with chunks and analysis"""
    original_article_id: str
    title: str
    clean_content: str
    chunks: List[ContentChunk]
    analysis: ContentAnalysis
    processed_at: datetime
    processing_status: str = "success"
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )