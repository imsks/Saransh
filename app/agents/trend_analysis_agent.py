from typing import Dict, Any, List
import logging

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class TrendAnalysisAgent(BaseAgent):
    """Agent for identifying emerging topics and patterns"""
    
    def __init__(self):
        super().__init__(
            name="Trend Analysis Agent",
            description="Identifies emerging topics, patterns, and trending stories across articles"
        )
    
    def get_prompt_template(self) -> str:
        return """You are a Trend Analysis Agent for Saransh news app.

        Your task is to analyze articles and identify emerging trends, patterns, and trending topics.

        Current Article:
        {current_article}

        Recent Articles Context:
        {recent_articles}

        Analysis Requirements:
        - Identify emerging topics and themes
        - Detect pattern changes over time
        - Highlight trending entities (people, places, events)
        - Assess story momentum and virality potential
        - Identify cross-topic connections

        Please analyze and provide:
        1. Emerging trends identified
        2. Trending entities and topics
        3. Pattern analysis
        4. Momentum indicators
        5. Cross-topic connections

        Format your response as JSON:
        {{
            "emerging_trends": [
                {{
                    "trend": "trend name",
                    "momentum": "rising/stable/declining",
                    "confidence": "high/medium/low",
                    "related_topics": ["topic1", "topic2"]
                }}
            ],
            "trending_entities": [
                {{
                    "entity": "entity name",
                    "type": "person/place/event/organization",
                    "frequency": "high/medium/low",
                    "sentiment": "positive/negative/neutral"
                }}
            ],
            "pattern_analysis": {{
                "story_arc": "developing/peaking/declining",
                "geographic_focus": ["region1", "region2"],
                "temporal_pattern": "breaking/ongoing/resolved"
            }},
            "cross_topic_connections": [
                {{
                    "topics": ["topic1", "topic2"],
                    "connection_strength": "strong/medium/weak",
                    "connection_type": "causal/correlational/thematic"
                }}
            ]
        }}"""
    
    def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process articles for trend analysis"""
        try:
            # Extract article data
            current_article = input_data.get("current_article", {})
            recent_articles = input_data.get("recent_articles", [])
            
            # Create chain
            chain = self.create_chain()
            
            # Prepare input for LangChain
            chain_input = {
                "current_article": str(current_article),
                "recent_articles": str(recent_articles)
            }
            
            # Execute chain
            result = chain.invoke(chain_input)
            
            # Parse JSON response
            import json
            try:
                parsed_result = json.loads(result)
                return {
                    "trend_analysis_result": parsed_result,
                    "raw_response": result,
                    "article_id": current_article.get("article_id", "unknown")
                }
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON response from {self.name}")
                return {
                    "trend_analysis_result": {"error": "Invalid JSON response"},
                    "raw_response": result,
                    "article_id": current_article.get("article_id", "unknown")
                }
                
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            return {"error": str(e)}
