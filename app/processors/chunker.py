import uuid
from typing import List
from .models import ContentChunk

class ContentChunker:
    """Splits content into overlapping chunks"""
    
    def __init__(self, chunk_size: int = 300, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_text(self, text: str) -> List[ContentChunk]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), self.chunk_size - self.overlap):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = ' '.join(chunk_words)
            
            chunk = ContentChunk(
                id=str(uuid.uuid4()),
                content=chunk_text,
                chunk_index=len(chunks),
                word_count=len(chunk_words),
                start_position=i,
                end_position=min(i + self.chunk_size, len(words))
            )
            chunks.append(chunk)
        
        return chunks