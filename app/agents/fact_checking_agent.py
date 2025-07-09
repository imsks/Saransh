from typing import Dict, Any, List
import logging

from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class FactCheckingAgent(BaseAgent):
    """Agent for validating information and sources"""
    
    def __init__(self):
        super().__init__(
            name="Fact-Checking Agent",
            description="Validates information accuracy, checks sources, and identifies potential misinformation"
        )
    
    def get_prompt_template(self) -> str:
        return """You are a Fact-Checking Agent for Saransh news app.

Your task is to analyze articles for factual accuracy, source credibility, and potential misinformation.

Article Content:
{article_content}

Article Sources:
{article_sources}

Fact-Checking Criteria:
- Source credibility and reputation
- Claim verification against known facts
- Logical consistency
- Bias detection
- Misinformation patterns

Please analyze this article and provide:
1. Overall credibility score (1-10)
2. Source reliability assessment
3. Factual claims identified
4. Potential issues or red flags
5. Verification recommendations

Format your response as JSON:
{{
    "credibility_score": 7,
    "source_assessment": "reliable/unreliable/mixed",
    "factual_claims": [
        {{
            "claim": "claim text",
            "verification_status": "verified/unverified/contested",
            "confidence": "high/medium/low"
        }}
    ],
    "potential_issues": ["issue1", "issue2"],
    "verification_recommendations": ["recommendation1", "recommendation2"],
    "overall_assessment": "reliable/questionable/unreliable"
}}"""
    
    def process_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process article for fact-checking"""
        try:
            # Extract article data
            article_content = input_data.get("article_content", "")
            article_sources = input_data.get("article_sources", [])
            
            # Create chain
            chain = self.create_chain()
            
            # Prepare input for LangChain
            chain_input = {
                "article_content": article_content,
                "article_sources": str(article_sources)
            }
            
            # Execute chain
            result = chain.invoke(chain_input)
            
            # Parse JSON response
            import json
            try:
                parsed_result = json.loads(result)
                return {
                    "fact_check_result": parsed_result,
                    "raw_response": result,
                    "article_id": input_data.get("article_id", "unknown")
                }
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON response from {self.name}")
                return {
                    "fact_check_result": {"error": "Invalid JSON response"},
                    "raw_response": result,
                    "article_id": input_data.get("article_id", "unknown")
                }
                
        except Exception as e:
            logger.error(f"Error in fact-checking: {e}")
            return {"error": str(e)}