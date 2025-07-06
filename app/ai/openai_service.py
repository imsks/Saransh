import openai
import tiktoken
import time
import logging
from typing import List, Dict, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    """OpenAI API service wrapper with rate limiting and error handling"""
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        self.rate_limit_delay = 1

    def _count_tokens(self, text: str) -> int:
        """Count the number of tokens in the text using tiktoken"""
        return len(self.encoding.encode(text))
    
    def _handle_rate_limit(self, retry_after: int = None) -> None:
        """Handle rate limit errors by waiting and retrying"""
        delay = retry_after or self.rate_limit_delay
        logger.warning(f"[OpenAI] Rate limited. Waiting {delay} seconds...")
        time.sleep(delay)

    def _make_request(self, messages: List[Dict], max_retries: int = 3) -> Optional[str]:
        logger.info(f"[OpenAI] Making API call with {len(messages)} messages")
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    max_tokens=settings.OPENAI_MAX_TOKENS,
                    temperature=settings.OPENAI_TEMPERATURE,
                )
                logger.info("[OpenAI] API call successful")
                return response.choices[0].message.content
            except openai.RateLimitError as e:
                self._handle_rate_limit()
                if attempt == max_retries - 1:
                    logger.error(f"[OpenAI] Rate limit exceeded after {max_retries} attempts")
                    raise
            except openai.APIError as e:
                logger.error(f"[OpenAI] API error: {e}")
                if attempt == max_retries - 1:
                    raise
            except Exception as e:
                logger.error(f"[OpenAI] Unexpected error: {e}")
                if attempt == max_retries - 1:
                    raise

            time.sleep(2 ** attempt)
        
        return None
    
    def _create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for a list of texts using OpenAI"""
        try:
            response = self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=texts
            )
            return [embedding.embedding for embedding in response.data]
        except Exception as e:
            logger.error(f"[OpenAI] Error creating embeddings: {e}")
            return []