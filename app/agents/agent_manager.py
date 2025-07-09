from typing import Dict, Any, List
import logging
from datetime import datetime

from app.agents.content_curation_agent import ContentCurationAgent
from app.agents.summarization_agent import SummarizationAgent
from app.agents.fact_checking_agent import FactCheckingAgent
from app.agents.trend_analysis_agent import TrendAnalysisAgent

logger = logging.getLogger(__name__)

class AgentManager:
    """Manages all LangChain agents and orchestrates their execution"""
    
    def __init__(self):
        self.agents = {
            "curation": ContentCurationAgent(),
            "summarization": SummarizationAgent(),
            "fact_checking": FactCheckingAgent(),
            "trend_analysis": TrendAnalysisAgent()
        }
        logger.info(f"🤖 Agent Manager initialized with {len(self.agents)} agents")
    
    def get_agent(self, agent_name: str):
        """Get a specific agent by name"""
        return self.agents.get(agent_name)
    
    def get_all_agents(self) -> Dict[str, Any]:
        """Get all agents"""
        return self.agents
    
    def execute_agent(self, agent_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific agent"""
        try:
            agent = self.get_agent(agent_name)
            if not agent:
                return {"error": f"Agent '{agent_name}' not found"}
            
            logger.info(f"🚀 Executing {agent_name} agent")
            result = agent.execute(input_data)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error executing {agent_name} agent: {e}")
            return {"error": str(e)}
    
    def execute_pipeline(self, input_data: Dict[str, Any], pipeline: List[str] = None) -> Dict[str, Any]:
        """Execute a pipeline of agents"""
        if pipeline is None:
            pipeline = ["curation", "summarization", "fact_checking", "trend_analysis"]
        
        results = {}
        start_time = datetime.now()
        
        try:
            logger.info(f"🔄 Starting agent pipeline: {pipeline}")
            
            for agent_name in pipeline:
                agent_result = self.execute_agent(agent_name, input_data)
                results[agent_name] = agent_result
                
                # Add agent result to input for next agent
                input_data[f"{agent_name}_result"] = agent_result
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            results.update({
                "pipeline_info": {
                    "agents_executed": pipeline,
                    "processing_time_seconds": processing_time,
                    "completed_at": datetime.now().isoformat()
                }
            })
            
            logger.info(f"✅ Agent pipeline completed in {processing_time:.2f}s")
            return results
            
        except Exception as e:
            logger.error(f"❌ Agent pipeline failed: {e}")
            return {"error": str(e)}
    
    def get_agent_stats(self) -> Dict[str, Any]:
        """Get statistics for all agents"""
        stats = {}
        for name, agent in self.agents.items():
            stats[name] = agent.get_stats()
        return stats

# Global agent manager instance
agent_manager = AgentManager()
