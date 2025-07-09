import json
from typing import Dict, Any, List
import logging

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ContentCurationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Content Curation Agent",
            description="Selects and curates relevant articles based on quality, relevance, and user preferences"
        )

    def get_prompt_template(self) -> str:
        return """You are a Content Curation Agent for a news aggregation app called Saransh.
        Your task is to analyze articles and determine their relevance, quality, and suitability for different user segments.
            Article Information:
            {article_data}

            User Preferences:
            {user_preferences}

            Curation Criteria:
            - Relevance to user interests
            - Information quality and accuracy
            - Timeliness and freshness
            - Diversity of sources
            - Balanced perspective

            Please analyze this article and provide:
            1. Relevance Score (1-10)
            2. Quality Score (1-10)
            3. Recommended User Segments
            4. Key Topics Identified
            5. Curation Decision (Include/Exclude/Flag)
            6. Reasoning for your decision
            Format your response as JSON:
            {{
                "relevance_score": 8,
                "quality_score": 7,
                "recommended_segments": ["general", "business"],
                "key_topics": ["technology", "innovation"],
                "curation_decision": "include",
                "reasoning": "High-quality article with relevant information for tech-savvy users"
            }}
        """
    
    def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process article for curation"""
        try:
            # Extract article data
            article_data = input_data.get("article_data", {})
            user_preferences = input_data.get("user_preferences", {})

            # Create chain
            chain = self.create_chain()

            # Prepare input for LangChain
            chain_input = {
                "article_data": str(article_data),
                "user_preferences": str(user_preferences)
            }

            # Execute chain
            result = chain.invoke(chain_input)

            # Parse JSON response
            try:
                parsed_result = json.loads(result)
                return {
                    "curation_result": parsed_result,
                    "raw_response": result,
                    "article_id": article_data.get("article_id", "unknown")
                }
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON response from {self.name}")
                return {
                    "curation_result": {"error": "Invalid JSON response"},
                    "raw_response": result,
                    "article_id": article_data.get("article_id", "unknown")
                }
        except Exception as e:
            logger.error(f"Error in content curation: {e}")
            return {"error": str(e)}