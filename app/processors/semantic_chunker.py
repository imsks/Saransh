from typing import List

from ..ai.openai_service import OpenAIService
from .models import ContentChunk
import re

class SemanticChunker:
    """Semantic chunking that splits at natural boundaries"""
    
    def __init__(self, max_chunk_size: int = 300):
        self.max_chunk_size = max_chunk_size
        self.openai_service = OpenAIService()
    
    def chunk_text(self, text: str) -> List[ContentChunk]:
        """Split text semantically using AI"""
        
        # First, try to split at natural boundaries
        natural_chunks = self._split_at_natural_boundaries(text)
        
        # If chunks are too large, use AI to split them
        final_chunks = []
        for chunk in natural_chunks:
            if len(chunk.split()) <= self.max_chunk_size:
                final_chunks.append(chunk)
            else:
                ai_chunks = self._ai_split_chunk(chunk)
                final_chunks.extend(ai_chunks)
        
        # Convert to ContentChunk objects
        return [self._create_chunk(chunk, i) for i, chunk in enumerate(final_chunks)]
    
    def _split_at_natural_boundaries(self, text: str) -> List[str]:
        """Split at natural boundaries like paragraphs and sentences"""
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            if len(current_chunk.split()) + len(paragraph.split()) <= self.max_chunk_size:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _ai_split_chunk(self, chunk: str) -> List[str]:
        """Use AI to intelligently split large chunks"""
        prompt = f"""
        Split this text into smaller, coherent chunks of maximum {self.max_chunk_size} words each.
        Preserve meaning and context. Return a JSON array of text chunks.
        
        Text: {chunk}
        """
        
        response = self.openai_service._make_request([
            {"role": "system", "content": "You are a text chunking expert. Return only a JSON array."},
            {"role": "user", "content": prompt}
        ])
        
        try:
            import json
            ai_chunks = json.loads(response)
            return ai_chunks if isinstance(ai_chunks, list) else [chunk]
        except:
            # Fallback to simple splitting
            return self._simple_split(chunk)
    
    def _simple_split(self, text: str) -> List[str]:
        """Simple fallback splitting"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.max_chunk_size):
            chunk_words = words[i:i + self.max_chunk_size]
            chunks.append(' '.join(chunk_words))
        
        return chunks
    
    def _create_chunk(self, content: str, index: int) -> ContentChunk:
        """Create a ContentChunk object"""
        return ContentChunk(
            id=f"chunk_{index}_{hash(content)}",
            content=content,
            chunk_index=index,
            word_count=len(content.split()),
            start_position=0,  # We'll enhance this later
            end_position=len(content)
        )
