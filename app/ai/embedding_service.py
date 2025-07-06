import chromadb
from chromadb.config import Settings
import logging
from typing import List, Dict

from app.ai.openai_service import OpenAIService
from ..config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for managing embeddings and vector operations"""

    def __init__(self):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=settings.CHROMA_DB_PATH,
        ))
        self.openai_service = OpenAIService()

    def _setup_collection(self):
        """Setup the articles collection"""
        # Get or create collection
        try:
            collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"description": "News article chunks and embeddings"}
            )
            logger.info(f"Collection '{settings.CHROMA_COLLECTION_NAME}' created or retrieved")
            return collection
        except Exception as e:
            logger.error(f"Error setting up collection: {e}")
            raise
    
    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for a list of texts using OpenAI"""
        try:
            return self.openai_service._create_embeddings(texts)
        except Exception as e:
            logger.error(f"Error creating embeddings: {e}")
            return []

    def store_article_chunks(self, article_id: str, chunks: List[Dict]) -> bool:
        """Store article chunks as vectors"""
        try:
            # Extract chunk texts
            texts = [chunk["content"] for chunk in chunks]
            
            # Create embeddings
            embeddings = self.create_embeddings(texts)

            # Prepare metadata
            metadatas = []
            ids = []

            for i, chunk in enumerate(chunks):
                metadata = {
                    "article_id": article_id,
                    "chunk_index": chunk["chunk_index"],
                    "word_count": chunk["word_count"],
                    "source": chunk.get("source", "unknown")
                }
                metadatas.append(metadata)
                ids.append(f"{article_id}_chunk_{i}")

            # Add to Collection
            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(f"Stored {len(chunks)} chunks for article {article_id}")
            return True
        except Exception as e:
            logger.error(f"Error storing article chunks: {e}")
            return False
        
    def similarity_search(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for similar articles"""
        try:
            # Create embedding for query
            query_embedding = self.openai_service._create_embeddings([query])[0]

            # Search collection
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )

            # Formatted results
            formatted_results = []
            for i in range(len(results['documents'][0])):
                result = {
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'similarity': 1 - results['distances'][0][i]
                }
                formatted_results.append(result)
            
            return formatted_results
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []