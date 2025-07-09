from typing import Dict, Any
import logging

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class SummarizationAgent(BaseAgent):
    """Agent for creating concise article summaries"""
    
    def __init__(self):
        super().__init__(
                name="Summarization Agent",
                description="Creates 60-word summaries with key points and insights"
            )
        
    def get_prompt_template(self) -> str:
        return """You are a Summarization Agent for Saransh news app.

        Your task is to create concise, informative summaries of news articles in exactly 60 words.

        Article Content:
        {article_content}

        Article Metadata:
        {article_metadata}

        Requirements:
        - Around 60 words
        - Include key facts and figures
        - Maintain objectivity
        - Highlight main story
        - Include location and timeframe if relevant
        - Use clear, engaging language

        Format your response as JSON:
        {{
            "summary": "Your 60-word summary here",
            "word_count": 60,
            "key_points": ["point1", "point2", "point3"],
            "entities": ["entity1", "entity2"],
            "sentiment": "neutral/positive/negative"
        }}"""
    
    def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process article for summarization"""
        try:
            # Extract article data
            article_content = input_data.get("article_content", "")
            article_metadata = input_data.get("article_metadata", {})
            
            # Create chain
            chain = self.create_chain()
            
            # Prepare input for LangChain
            chain_input = {
                "article_content": article_content,
                "article_metadata": str(article_metadata)
            }
            
            # Execute chain
            result = chain.invoke(chain_input)
            
            # Parse JSON response
            import json
            try:
                parsed_result = json.loads(result)
                return {
                    "summary_result": parsed_result,
                    "raw_response": result,
                    "article_id": article_metadata.get("article_id", "unknown")
                }
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON response from {self.name}")
                return {
                    "summary_result": {"error": "Invalid JSON response"},
                    "raw_response": result,
                    "article_id": article_metadata.get("article_id", "unknown")
                }
                
        except Exception as e:
            logger.error(f"Error in summarization: {e}")
            return {"error": str(e)}