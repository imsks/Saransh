import json
import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_agents():
    """Test all LangChain agents"""
    
    # Load test article
    with open("processed_article.json", "r") as f:
        article_data = json.load(f)
    
    base_url = "http://localhost:8000"
    
    # Test individual agents
    agents = ["curate", "summarize", "fact-check", "analyze-trends"]
    
    for agent in agents:
        logger.info(f"🧪 Testing {agent} agent...")
        
        # Fix: Wrap data in article_data field
        request_data = {
            "article_data": {
                "article_content": article_data["clean_content"],
                "article_metadata": {
                    "article_id": article_data["original_article_link"],
                    "title": article_data["title"],
                    "entities": article_data["analysis"]["entities"],
                    "key_topics": article_data["analysis"]["key_topics"]
                }
            }
        }
        
        response = requests.post(
            f"{base_url}/agents/{agent}",
            json=request_data
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ {agent} agent completed successfully")
            logger.info(f"Result: {json.dumps(result, indent=2)}")
        else:
            logger.error(f"❌ {agent} agent failed: {response.status_code}")
            logger.error(f"Error: {response.text}")
    
    # Test complete pipeline
    logger.info("🧪 Testing complete agent pipeline...")
    
    # Fix: Wrap data in article_data field
    pipeline_request_data = {
        "article_data": {
            "article_content": article_data["clean_content"],
            "article_metadata": {
                "article_id": article_data["original_article_link"],
                "title": article_data["title"],
                "entities": article_data["analysis"]["entities"],
                "key_topics": article_data["analysis"]["key_topics"]
            }
        }
    }
    
    response = requests.post(
        f"{base_url}/agents/pipeline",
        json=pipeline_request_data
    )
    
    if response.status_code == 200:
        result = response.json()
        logger.info("✅ Agent pipeline completed successfully")
        logger.info(f"Pipeline result: {json.dumps(result, indent=2)}")
    else:
        logger.error(f"❌ Agent pipeline failed: {response.status_code}")
        logger.error(f"Error: {response.text}")

if __name__ == "__main__":
    test_agents()
